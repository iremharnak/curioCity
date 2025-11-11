export const dynamic = 'force-dynamic';
"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function TestPage() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "curiosities_global"));
      setIds(snap.docs.map(d => d.id));
    })();
  }, []);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firestore Connection Test</h1>
      {ids.length ? <ul className="list-disc pl-6">{ids.map(id => <li key={id}>{id}</li>)}</ul> : <p>No data yet.</p>}
    </div>
  );
}
