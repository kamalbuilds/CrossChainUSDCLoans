import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const { abiFunctionSignature, abiParameters, contractAddress , walletid } = await req.json()

    const userCredentials = await acquire_session_token();
    console.log(userCredentials, "userCredentials");
    const userToken = userCredentials.userToken;

    const response = await axios.post(
      'https://api.circle.com/v1/w3s/user/transactions/contractExecution',
      {
        abiFunctionSignature,
        abiParameters,
        idempotencyKey: crypto.randomUUID(),
        contractAddress,
        feeLevel: 'HIGH',
        walletId: walletid
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-User-Token': userToken
        }
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error calling Circle API:', error)
    return NextResponse.json({ error: 'Error calling Circle API' }, { status: 500 })
  }
}

async function acquire_session_token() {
  try {
    const response = await axios.post(
      'https://api.circle.com/v1/w3s/users/token',
      { userId: process.env.NEXT_PUBLIC_CIRCLE_USER_ID },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data.data
  } catch (error) {
    console.error('Error acquiring session token:', error)
    throw error
  }
}
