import { helped } from "@/lib/helped";

export default function HelpedBar() {
  if (!helped.length) return null;
  return (
    <section className="helped" aria-label="کسانی که کمکشان کرده‌ایم">
      <div className="container helped-inner">
        <h2>به جمع کسانی که با <span>نکسوردو</span> رشد کردند بپیوندید</h2>
        <div className="helped-row">
          <a className="helped-join" href="/account">ثبت نام</a>
          <ul className="helped-avatars">
            {helped.map((person, i) => (
              <li key={person.name} style={{ zIndex: helped.length - i }} title={person.name}>
                {person.image ? <img src={person.image} alt={person.name} loading="lazy" /> : <span>{person.name.slice(0, 2).toUpperCase()}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
