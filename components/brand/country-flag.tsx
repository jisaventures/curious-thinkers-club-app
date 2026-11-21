import { AU, CA, DE, ES, FR, GB, IE, IT, NL, NZ, US } from "country-flag-icons/react/3x2";

const FLAGS = { AU, CA, DE, ES, FR, GB, IE, IT, NL, NZ, US };

const COUNTRY_CODES: Record<string, string> = {
  "united kingdom": "GB",
  "great britain": "GB",
  uk: "GB",
  gb: "GB",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  ireland: "IE",
  ie: "IE",
  france: "FR",
  fr: "FR",
  germany: "DE",
  de: "DE",
  spain: "ES",
  es: "ES",
  italy: "IT",
  it: "IT",
  netherlands: "NL",
  nl: "NL",
  australia: "AU",
  au: "AU",
  canada: "CA",
  ca: "CA",
  "new zealand": "NZ",
  nz: "NZ",
};

export function CountryFlag({ country, className = "" }: { country: string; className?: string }) {
  const code = COUNTRY_CODES[country.trim().toLowerCase()];
  const Flag = code && code in FLAGS ? FLAGS[code as keyof typeof FLAGS] : null;
  if (!Flag) return null;
  return (
    <span title={country} aria-label={country} className="inline-flex">
      <Flag aria-hidden="true" className={`inline-block shrink-0 rounded-[3px] shadow-[0_1px_0_rgba(23,53,40,0.18)] ${className}`} />
    </span>
  );
}
