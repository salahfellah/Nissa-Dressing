import { COLORS } from '../../theme/colors';

export default function Logo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isLarge = size === 'large';
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1
        className="font-playfair tracking-[0.2em] uppercase"
        style={{ color: COLORS.orDore, fontSize: isLarge ? '3.5rem' : '2rem', lineHeight: '1' }}
      >
        Nissa
      </h1>
      <div className="flex items-center justify-center w-full mt-2 mb-1">
        <div style={{ height: '1px', backgroundColor: COLORS.taupe, flex: 1 }}></div>
        <span
          className="mx-3 tracking-[0.3em] text-sm uppercase font-light"
          style={{ color: COLORS.brunProfond }}
        >
          Dressing
        </span>
        <div style={{ height: '1px', backgroundColor: COLORS.taupe, flex: 1 }}></div>
      </div>
      <span
        className="tracking-[0.4em] text-[0.6rem] uppercase mt-1 font-semibold"
        style={{ color: COLORS.brunProfond }}
      >
        Islamic Dresses
      </span>
    </div>
  );
}
