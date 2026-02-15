import { useEffect, useState } from 'react';
import { loadQRCodeScript } from '@/lib/api';

interface HostScreenProps {
  sessionId: string;
  kigo: string;
  season: string;
  onStartSession: () => void;
  onCancel: () => void;
}

export default function HostScreen({
  sessionId,
  kigo,
  season,
  onStartSession,
  onCancel,
}: HostScreenProps) {
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);

  useEffect(() => {
    if (!sessionId || qrCodeGenerated) return;

    const generateQR = async () => {
      try {
        await loadQRCodeScript();
        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer && window.QRCode) {
          qrContainer.innerHTML = '';
          const joinURL = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
          new window.QRCode(qrContainer, {
            text: joinURL,
            width: 256,
            height: 256,
            colorDark: '#1c1917',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.H,
          });
          setQrCodeGenerated(true);
        }
      } catch (error) {
        console.error('QRコード生成エラー:', error);
      }
    };
    generateQR();
  }, [sessionId, qrCodeGenerated]);

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">座を立てました</h2>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-stone-600 mb-4">お相手に以下のIDを伝えてください</p>
            <div className="bg-stone-100 p-6 rounded-lg mb-6">
              <div className="text-4xl font-bold text-stone-800 tracking-wider mb-2">{sessionId}</div>
              <div className="text-sm text-stone-600">
                季語：{kigo}（{season}）
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-stone-600 mb-4">または、QRコードを読み取ってもらう</p>
            <div className="bg-white p-4 rounded-lg inline-block border-2 border-stone-200">
              <div id="qrcode-container" className="flex items-center justify-center min-h-[256px]">
                <div className="text-stone-400">QRコード生成中...</div>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              スマホのカメラでこのQRコードを読み取ってください
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={onStartSession}
              className="w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors"
            >
              句会を始める
            </button>
            <button
              onClick={onCancel}
              className="w-full text-sm text-stone-600 hover:text-stone-800"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
