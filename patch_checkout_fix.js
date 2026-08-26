const fs = require('fs');
let content = fs.readFileSync('src/components/customer/CheckoutForm.tsx', 'utf8');

// Remove disabled from the input
content = content.replace(
  `required
                  disabled={pincodeStatus === 'idle'}
                />`,
  `required
                />`
);

// Add disabled to the textarea
content = content.replace(
  `required
                />
                {addressError`,
  `required
                  disabled={pincodeStatus === 'idle'}
                />
                {addressError`
);

fs.writeFileSync('src/components/customer/CheckoutForm.tsx', content, 'utf8');
console.log('Fixed disabled bug!');
