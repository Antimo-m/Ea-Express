import { useId, useState } from "react";
import { Field, Icon } from "./UI";
export default function SenderFields({ identity = {}, nameField = "name" }) {
  const [type, setType] = useState(identity.sender_type || "business");
  const [senderName, setSenderName] = useState(identity.store_name || identity.name || "");
  const suggestions = useId();
  const [businessType, setBusinessType] = useState(
    identity.business_type || "",
  );
  const [description, setDescription] = useState(
    identity.business_description || "",
  );
  return (
    <div className="sender-fields">
      <fieldset className="sender-selector">
        <legend>Chi spedisce?</legend>
        {[
          ["business", "shop", "Attività commerciale"],
          ["private", "person", "Privato"],
          ["online_shop", "bag", "Shop online"],
        ].map(([value, icon, label]) => (
          <label key={value} className={type === value ? "selected" : ""}>
            <input
              type="radio"
              name="sender_type"
              value={value}
              checked={type === value}
              onChange={() => { setType(value); setSenderName(""); }}
            />
            <Icon name={icon} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <Field
        label={
          type === "private" ? "Nome e cognome del mittente" : "Nome attività"
        }
        name={nameField}
        value={senderName}
        onChange={event => setSenderName(event.target.value)}
        placeholder={type === "private" ? "Nome e cognome" : "Nome della tua attività"}
        maxLength={150}
        required
        autoComplete={type === "private" ? "name" : "organization"}
      />
      {type !== "private" && (
        <div className="form-grid">
          <Field
            label="Tipologia di attività"
            name="business_type"
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            maxLength={100}
            list={suggestions}
            placeholder="Es. fiorista, artigiano, e-commerce"
            help="Scegli un suggerimento oppure scrivi liberamente."
          />
          <datalist id={suggestions}>
            {[
              "Abbigliamento",
              "Alimentari",
              "Fiorista",
              "Artigianato",
              "E-commerce",
              "Documenti e servizi",
            ].map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <Field
            label="Di cosa ti occupi? (facoltativo)"
            name="business_description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            placeholder="Es. composizioni floreali e piccoli regali"
          />
        </div>
      )}
    </div>
  );
}
