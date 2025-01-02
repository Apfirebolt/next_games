// pages/api/data.js

import { NextResponse } from 'next/server';

export async function GET(req) {

    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    const data = await fetchDataFromExternalAPI(); 
  
    return NextResponse.json(data, { status: 200 });
}

export async function POST(req) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    const data = await req.json();
    return NextResponse.json(data, { status: 200 });
  }
  
  async function fetchDataFromExternalAPI() {
    // Replace with your actual API call
    const response = await fetch('https://softgenie.org/api/movies'); 
    const data = await response.json();
    return data;
  }