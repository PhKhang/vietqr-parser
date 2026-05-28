export const AccountType = {
  QRIBFTTA: "QRIBFTTA",
  QRIBFTTC: "QRIBFTTC",
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

export function getAccountType(value: string | undefined): AccountType {
  return value === "QRIBFTTC" ? AccountType.QRIBFTTC : AccountType.QRIBFTTA;
}

export const Method = {
  STATIC: "11",
  DYNAMIC: "12",
} as const;

export type Method = typeof Method[keyof typeof Method];

export function getMethod(value: string | undefined): Method {
  return value === "12" ? Method.DYNAMIC : Method.STATIC;
}

export const PayloadFormat = {
  FORMAT_01: "01",
} as const;

export type PayloadFormat = typeof PayloadFormat[keyof typeof PayloadFormat];

export function getPayloadFormat(): PayloadFormat {
  return PayloadFormat.FORMAT_01;
}

export const Currency = {
  VND: "704",
} as const;

export type Currency = typeof Currency[keyof typeof Currency];

export function getCurrency(): Currency {
  return Currency.VND;
}

export const Country = {
  VN: "VN",
} as const;

export type Country = typeof Country[keyof typeof Country];

export function getCountry(): Country {
  return Country.VN;
}

export interface VietQRData {
  payloadFormat: PayloadFormat;
  method: Method;
  accountBankBin: string;
  accountNumber: string;
  accountType: AccountType;
  currency: Currency;
  amount: string | null;
  country: Country;
  additional: string | null;
  note: string | null;
  crc: string | null;
  rawFields: Map<string, string>;
}

export class VietQRParser {
  invoke(data: string): { success: boolean; data?: VietQRData; error?: string } {
    try {
      let index = 0;
      const map = new Map<string, string>();

      const readField = (): [string, string] => {
        if (index + 4 > data.length) {
          throw new Error("Invalid QR data format");
        }
        const id = data.substring(index, index + 2);
        const len = parseInt(data.substring(index + 2, index + 4), 10);
        if (isNaN(len) || index + 4 + len > data.length) {
          throw new Error(`Invalid field: id=${id}, len=${len}`);
        }
        const value = data.substring(index + 4, index + 4 + len);
        index += 4 + len;
        return [id, value];
      };

      while (index < data.length - 1) {
        const [id, value] = readField();
        map.set(id, value);

        // Special handling for composite field ID 38 (beneficiary)
        if (id === "38") {
          let subIdx = 0;
          while (subIdx < value.length) {
            if (subIdx + 4 > value.length) break;
            const subId = value.substring(subIdx, subIdx + 2);
            const subLen = parseInt(value.substring(subIdx + 2, subIdx + 4), 10);
            if (isNaN(subLen) || subIdx + 4 + subLen > value.length) break;
            const subVal = value.substring(subIdx + 4, subIdx + 4 + subLen);
            subIdx += 4 + subLen;

            if (subId === "01") {
              // Parse bank BIN and account number
              let subSubIdx = 2;
              if (subSubIdx + 2 <= subVal.length) {
                const subLength = parseInt(
                  subVal.substring(subSubIdx, subSubIdx + 2),
                  10
                );
                if (!isNaN(subLength) && subSubIdx + 2 + subLength <= subVal.length) {
                  subSubIdx += 2;
                  map.set("38-00", subVal.substring(subSubIdx, subSubIdx + subLength));

                  subSubIdx += subLength;
                  if (subSubIdx + 2 <= subVal.length) {
                    subSubIdx += 2; // skip the id

                    if (subSubIdx + 2 <= subVal.length) {
                      const subLength2 = parseInt(
                        subVal.substring(subSubIdx, subSubIdx + 2),
                        10
                      );
                      if (
                        !isNaN(subLength2) &&
                        subSubIdx + 2 + subLength2 <= subVal.length
                      ) {
                        subSubIdx += 2;
                        map.set(
                          "38-01",
                          subVal.substring(subSubIdx, subSubIdx + subLength2)
                        );
                      }
                    }
                  }
                }
              }
            } else {
              map.set(`38-${subId}`, subVal);
            }
          }
        }

        // Special handling for composite field ID 62 (additional info)
        if (id === "62") {
          let subIdx = 0;
          while (subIdx < value.length) {
            if (subIdx + 4 > value.length) break;
            const subId = value.substring(subIdx, subIdx + 2);
            const subLen = parseInt(value.substring(subIdx + 2, subIdx + 4), 10);
            if (isNaN(subLen) || subIdx + 4 + subLen > value.length) break;
            const subVal = value.substring(subIdx + 4, subIdx + 4 + subLen);

            subIdx += 4 + subLen;
            map.set(`62-${subId}`, subVal);
          }
        }
      }

      const result: VietQRData = {
        payloadFormat: getPayloadFormat(),
        method: getMethod(map.get("01")),
        accountBankBin: map.get("38-00") || "",
        accountNumber: map.get("38-01") || "",
        accountType: getAccountType(map.get("38-02")),
        currency: getCurrency(),
        amount: map.get("54") || null,
        country: getCountry(),
        additional: map.get("62") || null,
        note: map.get("62-08") || null,
        crc: map.get("63") || null,
        rawFields: map,
      };

      return { success: true, data: result };
    } catch (ex) {
      return {
        success: false,
        error: ex instanceof Error ? ex.message : "Unknown error",
      };
    }
  }
}
