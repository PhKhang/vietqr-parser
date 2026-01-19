# 🇻🇳 VietQR Scanner

A modern web application for scanning and parsing Vietnamese QR codes (VietQR). Built with React, TypeScript, and Vite.

## Features

✨ **Live Camera Scanning** - Real-time QR code detection using your device camera
📁 **Image Upload** - Upload QR code images from your device
🎨 **Beautiful UI** - Modern, responsive design with gradient backgrounds
📊 **Detailed Information Display** - Shows all parsed VietQR data in organized cards
📱 **Mobile Friendly** - Fully responsive design works on all devices
🔒 **Local Processing** - All data processing happens in your browser (no server required)

## What is VietQR?

VietQR is a standardized QR code format used in Vietnam for bank transfers. It encodes information such as:
- Bank BIN and account number
- Transaction method (static or dynamic)
- Currency (VND)
- Amount (optional)
- Payment note/description
- CRC checksum

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

## How to Use

### 1. **Camera Scanning**
   - Click "Start Camera" button
   - Position the QR code in the center frame
   - The app will automatically detect and parse the QR code
   - Camera will stop once a QR code is detected

### 2. **Image Upload**
   - Click "Choose Image from Gallery"
   - Select an image containing a QR code
   - The app will detect and parse the QR code from the image

### 3. **View Results**
   - **Bank Information** - Bank BIN, account number, account type
   - **Transaction Details** - Method type, currency, amount
   - **Additional Information** - Country, payload format, note, CRC
   - **Raw Fields** - All parsed field data in a table format

## Technical Details

### Parser Implementation

The VietQR parser in `src/vietqrParser.ts` is a direct TypeScript port of the Kotlin parsing logic provided, featuring:

- **Field Reading** - Reads 4-character field headers (2-char ID + 2-char length) followed by field data
- **Composite Field Handling** - Special parsing for field 38 (beneficiary) and field 62 (additional info)
- **Error Handling** - Graceful error handling with detailed error messages
- **Type Safety** - Full TypeScript support with enums and interfaces

### Key Field Mappings

| Field ID | Description |
|----------|-------------|
| 00 | Payload Format |
| 01 | Method (11=Static, 12=Dynamic) |
| 38 | Beneficiary Information |
| 38-00 | Bank BIN |
| 38-01 | Account Number |
| 38-02 | Account Type |
| 53 | Currency (704=VND) |
| 54 | Amount |
| 58 | Country (VN) |
| 62 | Additional Information |
| 62-08 | Note/Description |
| 63 | CRC Checksum |

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **jsQR** - QR code detection library
- **CSS3** - Modern styling with gradients and animations

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers with camera access

## Security

- All processing is done locally in your browser
- No data is sent to any server
- No tracking or analytics
- Safe for sensitive financial data

## Demo Data

Test the parser with this sample VietQR code:

```
0002010102125303704540470005802VN38620010A0000007270132000697110001180061011003628063360208QRIBFTTA624501121003628063360825Thanh toan ho so DVC G01.63049089
```

## Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Try a different browser
- Ensure HTTPS is used (required for camera access)

### QR Code Not Detected
- Ensure good lighting
- Position QR code in the center frame
- Try a higher resolution image
- Verify the QR code is a valid VietQR code

### Image Upload Issues
- Use PNG, JPG, or WebP format
- Ensure the image contains a clear QR code
- Try a higher resolution image

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Support

For questions or issues, please open a GitHub issue.

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
