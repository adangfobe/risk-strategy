import { NextResponse } from 'next/server';
import { DeepgramClient } from '@deepgram/sdk';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPGRAM_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const client = new DeepgramClient({ apiKey });

    const response = await client.listen.v1.media.transcribeFile(buffer, {
      model: 'nova-3',
      smart_format: true,
    });

    if (!('results' in response)) {
      return NextResponse.json({ error: 'Transcription pending — try again' }, { status: 202 });
    }

    const transcript =
      response.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error('Transcribe route error:', err);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
