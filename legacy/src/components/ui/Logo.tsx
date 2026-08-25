export default function Logo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isLarge = size === 'large';
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1
        className={`font-playfair tracking-[0.2em] uppercase leading-none text-orDore ${
          isLarge ? 'text-5xl md:text-6xl' : 'text-3xl'
        }`}
      >
        Nissa
      </h1>
      <div className="flex items-center justify-center w-full mt-2 mb-1">
        <div className="h-px flex-1 bg-taupe" />
        <span className="mx-3 tracking-[0.3em] text-sm uppercase font-light text-brunProfond">
          Dressing
        </span>
        <div className="h-px flex-1 bg-taupe" />
      </div>
      <span className="tracking-[0.4em] text-[0.6rem] uppercase mt-1 font-semibold text-brunProfond">
        Islamic Dresses
      </span>
    </div>
  );
}
