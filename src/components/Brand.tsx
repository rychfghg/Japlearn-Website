import appLogo from "../assets/app-logo.png";

type BrandProps = {
  light?: boolean;
};

export default function Brand({ light = false }: BrandProps) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <img src={appLogo} alt="JapLearn app logo" />
      </span>
      <span>
        <b>JAPLEARN</b>
        <small>Japanese made interactive</small>
      </span>
    </div>
  );
}
