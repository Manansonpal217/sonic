import { redirect } from 'next/navigation';

/**
 * Product leads are now shown in the Orders module.
 * Redirect old /product-leads links to /orders.
 */
export default function ProductLeadsRedirect() {
  redirect('/orders');
}
