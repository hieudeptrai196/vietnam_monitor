import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/VND', {
      next: { revalidate: 3600 } // cache 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from ER API');
    }

    const data = await response.json();
    
    // We get 1 VND = X CURRENCY. So we need 1 / X to get 1 CURRENCY = Y VND
    const rates = data.rates;
    
    const exchangeList = [
      { id: 'usd', name: 'US Dollar', symbol: 'USD', value: 1 / rates.USD, change: 0.12 },
      { id: 'eur', name: 'Euro', symbol: 'EUR', value: 1 / rates.EUR, change: -0.05 },
      { id: 'jpy', name: 'Japanese Yen', symbol: 'JPY', value: 1 / rates.JPY, change: 0.8 },
      { id: 'krw', name: 'South Korean Won', symbol: 'KRW', value: 1 / rates.KRW, change: -0.21 },
      { id: 'cny', name: 'Chinese Yuan', symbol: 'CNY', value: 1 / rates.CNY, change: 0.05 },
      { id: 'gbp', name: 'British Pound', symbol: 'GBP', value: 1 / rates.GBP, change: 0.3 },
    ];

    return NextResponse.json(exchangeList);
  } catch (error) {
    console.error('Exchange API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching exchange rates' },
      { status: 500 }
    );
  }
}
