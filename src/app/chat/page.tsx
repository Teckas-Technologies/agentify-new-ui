"use client";

import Playground from '@/Components/NewDesign/playground/Playground';
import React from 'react';

import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("../../Components/ClientLayout"), {
    ssr: false,
});


export default function ChatPage() {
    return (
        <ClientLayout>
            <main className="min-h-screen bg-[var(--bg-dark)] text-white">
                <Playground />
            </main>
        </ClientLayout>
    );
}