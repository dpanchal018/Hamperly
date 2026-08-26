const fs = require('fs');
let content = fs.readFileSync('src/actions/checkout.actions.ts', 'utf8');

// Update signature
content = content.replace(
  `export async function placeCustomerOrder(cartItems: any[], deliveryAddress?: string) {`,
  `export async function placeCustomerOrder(cartItems: any[], deliveryAddress?: string, pincode?: string) {`
);

// Update customer logic
const oldLogic = `    // Update customer address if provided
    if (deliveryAddress !== undefined) {
      await supabaseAdmin
        .from('customers')
        .update({ address: deliveryAddress })
        .eq('id', customer.id);
    }`;

const newLogic = `    // Update customer address and pincode if provided
    const updateData: any = {};
    if (deliveryAddress !== undefined) updateData.address = deliveryAddress;
    if (pincode !== undefined) updateData.pincode = pincode;
    
    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin
        .from('customers')
        .update(updateData)
        .eq('id', customer.id);
    }`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync('src/actions/checkout.actions.ts', content, 'utf8');
console.log('Action patched');
