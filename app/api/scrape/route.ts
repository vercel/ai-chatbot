export async function GET() {
  try {
    const response = await fetch('https://lextgpt-puppeteer.onrender.com/scrape', {
      method: 'POST'
      body: {}
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}