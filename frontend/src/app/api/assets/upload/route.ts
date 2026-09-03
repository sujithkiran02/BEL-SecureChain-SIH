import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData() as any;
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const classification = formData.get('classification') as string;

    if (!file || !name || !classification) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // SIMULATE IPFS UPLOAD DELAY (e.g. Pinata)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // GENERATE FAKE CID
    const fakeCID = 'Qm' + Array.from({ length: 44 }, () => 
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 58))
    ).join('');

    const ipfsURI = `ipfs://${fakeCID}`;

    return NextResponse.json({
      success: true,
      uri: ipfsURI,
      message: 'Successfully pinned to IPFS (Mock)',
    });
  } catch (error) {
    console.error('IPFS Upload Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}
