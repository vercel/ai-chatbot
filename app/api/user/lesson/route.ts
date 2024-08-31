import check_missing_fields from '@/lib/api/check_missing_fields';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(
  'sk_test_51PbYoJRsQmUQn4A3WSGMWGEy7sUE3S0GwyRxjj0Gwv3IHoXfLQVI92h3KP7JHMPozEvJb76UxjBu19Sdh4hShR9J00l9sZoAba',
  {
    apiVersion: '2024-06-20',
  }
);

export async function POST(request: NextRequest) {
    console.log("Hello world")
}
