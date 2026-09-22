import { useState } from 'react';
import PTDList from './PTDList.jsx';
import DetailedPtd from './DetailedPtd.jsx';

export default function PTDApp({ dark }) {
  const [selectedPtd, setSelectedPtd] = useState(null);

  if (selectedPtd) {
    return (
      <DetailedPtd
        key={selectedPtd}
        dark={dark}
        ptdId={selectedPtd}
        onBack={() => setSelectedPtd(null)}
      />
    );
  }

  return <PTDList dark={dark} onOpen={setSelectedPtd} />;
}