# Invoice Designer Preview Button Implementation

## Overview
Implemented a fully functional preview button in the Invoice Designer page that generates a live HTML preview of the invoice/proforma with all customizations applied.

## Features Implemented

### 1. Preview Button Styling
- **Blue background** (#1e40af / blue-600) matching the image provided
- **Eye icon** from Lucide React
- **Hover effect** - Darker blue on hover (blue-700)
- **Disabled state** - Opacity 50% when loading
- **Smooth transitions** - Color transitions on hover
- **Proper spacing** - Consistent padding and margins

### 2. Preview Functionality
The preview button now:
- Opens a new browser window with the generated preview
- Applies **all design settings** from the designer:
  - Colors (primary, secondary, accent, text)
  - Fonts (family, sizes for title, heading, body, small)
  - Layout (header style, logo position, margins)
  - Branding (logo, firm name, tagline)
  - Content options (line numbers, tax breakdown, payment terms, banking details)
  - Banking information

### 3. Preview Content
The preview includes:
- **Header Section**:
  - Logo (if uploaded and enabled)
  - Document title (INVOICE or PRO FORMA INVOICE)
  - Firm name and tagline
  - Styled with primary color border

- **Client Information**:
  - Bill To section with sample client data
  - Invoice/Pro Forma details (number, date, matter)

- **Line Items Table**:
  - Sample legal services with descriptions
  - Optional line numbers
  - Quantity, rate, and amount columns
  - Professional table styling with primary color header

- **Totals Section**:
  - Subtotal
  - VAT breakdown (if enabled)
  - Grand total with primary color styling

- **Payment Terms** (if enabled):
  - Custom payment terms text
  - Professional formatting

- **Banking Details** (if enabled):
  - Bank name, account name, account number
  - Branch code and SWIFT code
  - Styled as footer section

- **Custom Footer** (if provided):
  - User-defined footer text

### 4. Dynamic Styling
All styles are dynamically generated based on settings:
```javascript
font-family: ${settings.fonts.family}
margin: ${settings.layout.margins.top}mm ${settings.layout.margins.right}mm
color: ${settings.colors.text}
background: ${settings.colors.primary}
font-size: ${settings.fonts.titleSize}pt
text-align: ${settings.layout.headerStyle}
```

### 5. Responsive Features
- **Print-ready** - Includes print media query
- **Proper spacing** - Professional margins and padding
- **Grid layout** - Two-column info grid
- **Table formatting** - Clean, professional table design

### 6. User Experience
- **Loading state** - Shows loading during preview generation
- **Toast notifications**:
  - Success: "Preview opened in new window"
  - Error: "Please allow pop-ups to preview the PDF"
  - Error: "Failed to generate preview"
- **Pop-up blocker detection** - Warns user if pop-ups are blocked
- **New window** - Opens in separate window for easy comparison

## Technical Implementation

### Preview Generation Process
1. User clicks "Preview" button
2. Set loading state to true
3. Create new browser window
4. Generate HTML with inline CSS using template literals
5. Apply all design settings dynamically
6. Write HTML to new window
7. Display success/error toast
8. Set loading state to false

### HTML Template Structure
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Invoice/Pro Forma Preview</title>
    <style>
      /* Dynamic CSS based on settings */
    </style>
  </head>
  <body>
    <!-- Header with logo and title -->
    <!-- Client and invoice information -->
    <!-- Line items table -->
    <!-- Totals section -->
    <!-- Payment terms -->
    <!-- Banking details -->
    <!-- Custom footer -->
  </body>
</html>
```

### Sample Data
The preview uses realistic sample data:
- Client: "Client Name" with email and address
- Invoice number: INV-2024-001 or PF-2024-001
- Date: Current date in South African format
- Line items: Legal consultation, document prep, court appearance
- Amounts: R 5,000, R 3,500, R 7,500
- Total: R 18,400 (including VAT)

## Button Styling Details

### CSS Classes Applied
```css
inline-flex items-center    /* Flexbox layout */
px-4 py-2                   /* Padding */
bg-blue-600                 /* Blue background */
text-white                  /* White text */
rounded-lg                  /* Rounded corners */
hover:bg-blue-700          /* Darker on hover */
transition-colors          /* Smooth transition */
disabled:opacity-50        /* Disabled state */
disabled:cursor-not-allowed /* Disabled cursor */
```

### Visual Appearance
- **Color**: Blue (#2563eb)
- **Text**: White
- **Icon**: Eye icon (Lucide React)
- **Size**: Medium (px-4 py-2)
- **Border Radius**: Large (rounded-lg)
- **Hover**: Darker blue (#1d4ed8)

## Testing the Preview

### How to Test
1. Navigate to Invoice Designer page
2. Customize any settings (colors, fonts, layout, etc.)
3. Click the blue "Preview" button
4. New window opens with live preview
5. All customizations should be visible
6. Try different preview modes (Invoice vs Pro Forma)
7. Test with different settings combinations

### Expected Behavior
- ✅ Preview opens in new window
- ✅ All colors match selected colors
- ✅ Fonts match selected fonts and sizes
- ✅ Layout matches selected options
- ✅ Logo appears if uploaded
- ✅ Line numbers show/hide based on setting
- ✅ Tax breakdown shows/hide based on setting
- ✅ Payment terms show/hide based on setting
- ✅ Banking details show/hide based on setting
- ✅ Custom text appears if provided
- ✅ Preview mode switches between Invoice and Pro Forma

## Future Enhancements
1. **PDF Download** - Add button to download preview as PDF
2. **Print Function** - Add print button in preview window
3. **Email Preview** - Send preview via email
4. **Multiple Templates** - Save and load different preview templates
5. **Real Data** - Use actual invoice data instead of sample data
6. **Side-by-side View** - Show preview alongside designer
7. **Mobile Preview** - Responsive preview for mobile devices
8. **Export Options** - Export as PDF, HTML, or image

## Browser Compatibility
- ✅ Chrome/Edge - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support
- ⚠️ Pop-up blockers - User must allow pop-ups

## Benefits
1. **Instant Feedback** - See changes immediately
2. **Professional Preview** - Realistic invoice appearance
3. **Easy Comparison** - Compare different designs
4. **Client Presentation** - Show clients how invoices will look
5. **Quality Assurance** - Verify design before saving
6. **Time Saving** - No need to generate actual invoices to test
