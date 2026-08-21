import { exportPurchasesToExcel } from '@/actions/purchase.actions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { buffer, error } = await exportPurchasesToExcel();

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!buffer) {
      return NextResponse.json({ error: 'Failed to generate excel' }, { status: 500 });
    }

    // Convert number[] to Buffer
    const fileBuffer = Buffer.from(buffer as any);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="hamperly-customer-purchases-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
