import supabase from '@/lib/supabase/supabase';
import create_response from '@/lib/api/create_response';
import check_missing_fields from '@/lib/api/check_missing_fields';
import { NextRequest } from 'next/server';

// Define a type for the expected request body
type UpdateSubscriptionData = {
  user_id: string;
  promo_code: string;
};

export async function POST(request: NextRequest) {
  try {
    console.log('Received request to update subscription and classes');
    
    const res: UpdateSubscriptionData = await request.json();
    console.log('Parsed request body:', res);

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['user_id', 'promo_code'],
      reqBody: res,
    });

    if (missing_fields) {
      console.log('Missing fields:', missing_fields);
      return create_response({
        request,
        data: { missing_fields },
        status: 400,
      });
    }

    const { user_id, promo_code } = res;
    console.log(`Received user_id: ${user_id}, promo_code: ${promo_code}`);

    // 1. Validate the promo code and get the corresponding time value
    const { data: promoData, error: promoError } = await supabase
      .from('promo_codes')
      .select('time')
      .eq('name', promo_code)
      .single();

    if (promoError || !promoData) {
      console.log('Promo code validation error or promo code not found:', promoError || 'No data');
      return create_response({
        request,
        data: { error: 'Invalid or expired promo code' },
        status: 400,
      });
    }

    const promoTime = promoData.time;
    console.log(`Promo code valid, applying time: ${promoTime}`);

    // 2. Update the user's subscription in the users table
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ subscription: true })
      .eq('id', user_id);

    if (updateUserError) {
      console.log('Error updating user subscription:', updateUserError.message);
      return create_response({
        request,
        data: { error: updateUserError.message },
        status: 500,
      });
    }

    console.log(`User subscription updated successfully for user_id: ${user_id}`);

    // 3. Update user_classes_left in the user_classes table based on the user_id
    const { error: updateClassesError } = await supabase
      .from('user_progress')
      .update({ user_classes_left: promoTime }) // Set classes left to the time from promo_codes
      .eq('user_id', user_id);

    if (updateClassesError) {
      console.log('Error updating user classes left:', updateClassesError.message);
      return create_response({
        request,
        data: { error: updateClassesError.message },
        status: 500,
      });
    }

    console.log(`User classes updated successfully for user_id: ${user_id} with ${promoTime} classes`);

    return create_response({
      request,
      data: { message: 'Subscription and user classes updated successfully' },
      status: 200,
    });
  } catch (err) {
    console.error('Error handling POST request:', err);
    return create_response({
      request,
      data: { error: 'Internal Server Error' },
      status: 500,
    });
  }
}
