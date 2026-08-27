const fs = require('fs');
let content = fs.readFileSync('src/actions/checkout.actions.ts', 'utf8');

const oldSignature = `export async function placeCustomerOrder(cartItems: any[], deliveryAddress?: string, pincode?: string) {`;

const newSignature = `
export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
}

export async function placeCustomerOrder(
  cartItems: any[], 
  deliveryAddress?: string, 
  pincode?: string,
  guestDetails?: GuestDetails
) {
  try {
    const user = await getCurrentUser();
    let customerId = '';
    let customerName = '';
    let customerPhone = '';

    if (user) {
      // LOGGED IN USER
      const supabase = await createClient(); 
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, full_name, mobile_number')
        .eq('user_id', user.id)
        .single();
        
      if (customerError || !customer) throw new Error("Customer profile not found");
      
      customerId = customer.id;
      customerName = customer.full_name;
      customerPhone = customer.mobile_number || '';

      const updateData: any = {};
      if (deliveryAddress !== undefined) updateData.address = deliveryAddress;
      if (pincode !== undefined) updateData.pincode = pincode;
      
      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin.from('customers').update(updateData).eq('id', customer.id);
      }
    } else {
      // GUEST USER
      if (!guestDetails) throw new Error("Guest details required for unauthenticated checkout");
      
      // Try to find if guest email already exists
      const { data: existingGuest } = await supabaseAdmin
        .from('customers')
        .select('id, full_name, mobile_number')
        .eq('email', guestDetails.email)
        .limit(1)
        .single();
        
      if (existingGuest) {
        customerId = existingGuest.id;
        customerName = existingGuest.full_name;
        customerPhone = existingGuest.mobile_number || '';
        
        // Update their address
        const updateData: any = {};
        if (deliveryAddress !== undefined) updateData.address = deliveryAddress;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin.from('customers').update(updateData).eq('id', customerId);
        }
      } else {
        // Create new guest customer
        const guestRef = 'GST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newGuest, error: createError } = await supabaseAdmin
          .from('customers')
          .insert({
            customer_reference: guestRef,
            full_name: guestDetails.fullName,
            email: guestDetails.email,
            mobile_number: guestDetails.phone,
            address: deliveryAddress,
            pincode: pincode,
            is_active: true
          })
          .select('id')
          .single();
          
        if (createError || !newGuest) throw new Error("Failed to create guest profile: " + (createError?.message || 'Unknown'));
        customerId = newGuest.id;
        customerName = guestDetails.fullName;
        customerPhone = guestDetails.phone;
      }
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }
`;

const startIndex = content.indexOf(oldSignature);
const endIndex = content.indexOf(`if (!cartItems || cartItems.length === 0) {`);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.replace(content.substring(startIndex, endIndex + `if (!cartItems || cartItems.length === 0) {`.length), newSignature);
  content = content.replace(`await requireCustomer();`, `// Removed requireCustomer to allow guest checkout`);
  // Fix the customer ID references in the rest of the function
  content = content.replace(/customer\.id/g, 'customerId');
  content = content.replace(/customer\.full_name/g, 'customerName');
  content = content.replace(/customer\.mobile_number/g, 'customerPhone');
  
  fs.writeFileSync('src/actions/checkout.actions.ts', content, 'utf8');
  console.log('Patched placeCustomerOrder to allow guests');
} else {
  console.log('Failed to find replacement indices');
}
