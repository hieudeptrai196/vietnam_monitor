import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Top 10 coins by market cap or popular ones
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano&vs_currencies=usd,vnd&include_24hr_change=true', {
      next: { revalidate: 120 } // cache 2 mins
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from CoinGecko');
    }

    const data = await response.json();
    
    // Transform data for UI
    const cryptoList = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', ...data.bitcoin },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', ...data.ethereum },
      { id: 'solana', name: 'Solana', symbol: 'SOL', ...data.solana },
      { id: 'binancecoin', name: 'BNB', symbol: 'BNB', ...data.binancecoin },
    ];

    return NextResponse.json(cryptoList);
  } catch (error) {
    console.error('Crypto API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching crypto prices' },
      { status: 500 }
    );
  }
}
