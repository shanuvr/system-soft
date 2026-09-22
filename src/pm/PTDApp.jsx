import { useState } from 'react';
import PTDList from './PTDList.jsx';
import PTDDetail from './PTDDetail.jsx';

export default function PTDApp({ dark }) {
  const [selectedPtd, setSelectedPtd] = useState(null);

  if (selectedPtd) {
    return (
      <PTDDetail
        key={selectedPtd}
        dark={dark}
        ptdId={selectedPtd}
        onBack={() => setSelectedPtd(null)}
      />
    );
  }

  return <PTDList dark={dark} onOpen={setSelectedPtd} />;
}