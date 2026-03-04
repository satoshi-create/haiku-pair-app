import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    if (!sessionId || !canvasRef.current) return;

    const joinURL = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;

    QRCode.toCanvas(canvasRef.current, joinURL, {
      width: 256,
      margin: 2,
      color: { dark: '#1c1917', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).catch((err) => {
      console.error('QRコード生成エラー:', err);
      setQrError(true);
    });
  }, [sessionId]);

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">座を立てました</h2>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-xl text-stone-600 mb-4">お相手に以下のIDを伝えてください</p>
            <div className="bg-stone-100 p-6 rounded-lg mb-6">
              <div className="text-4xl font-bold text-stone-800 tracking-wider">{sessionId}</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-stone-600 mb-4">または、QRコードを読み取ってもらう</p>
            <div className="bg-white p-4 rounded-lg inline-block border-2 border-stone-200">
              {qrError ? (
                <div className="flex items-center justify-center min-h-64 min-w-64 text-stone-400">
                  QRコードの生成に失敗しました
                </div>
              ) : (
                <canvas ref={canvasRef} />
              )}
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
