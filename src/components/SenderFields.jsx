import { useId, useState } from "react";
import { Field, Icon } from "./UI";
export default function SenderFields({ identity = {}, nameField = "name", selectableType = true, profileType }) {
  const [selectedType, setType] = useState(identity.sender_type || identity.customer_type || "business");
  const type = selectableType ? selectedType : profileType;
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
      {selectableType ? <fieldset className="sender-selector">
        <legend>Tipo mittente</legend>
        {[
          ["private", "person", "Privato"],
          ["business", "shop", "Attività commerciale"],
          ["online_shop", "bag", "Shop online"],
        ].map(([value, icon, label]) => (
          <label key={value} className={type === value ? "selected" : ""}>
            <input
              type="radio"
              name="sender_type"
              value={value}
              checked={type === value}
              onChange={() => setType(value)}
            />
            <Icon name={icon} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset> : <p className="sender-profile-type"><Icon name={type === "private" ? "person" : type === "online_shop" ? "bag" : "shop"} /> <strong>{{private: "Privato", business: "Attività commerciale", online_shop: "Shop online"}[type] || "Completa il profilo"}</strong><span>Dal tuo profilo</span></p>}
      <Field
        label={
          type === "private" ? "Nome e cognome del mittente" : "Nome attività"
        }
        width={nameField === "store_name" ? "name" : undefined}
        name={nameField}
        value={senderName}
        onChange={event => setSenderName(event.target.value)}
        placeholder={type === "private" ? "Nome e cognome" : "Nome della tua attività"}
        maxLength={150}
        required
        autoComplete={type === "private" ? "name" : "organization"}
      />
      {type === "business" && (
        <div className={nameField === "store_name" ? "booking-grid booking-business" : "form-grid"}>
          <Field
            label="Tipologia attività"
            width={nameField === "store_name" ? "business" : undefined}
            name="business_type"
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            readOnly={!selectableType}
            maxLength={100}
            list={suggestions}
            placeholder="Scegli o scrivi liberamente"
            help={selectableType ? "Scegli un suggerimento oppure scrivi liberamente." : "Tipologia attività salvata nel profilo."}
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
            width={nameField === "store_name" ? "description" : undefined}
            name="business_description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            readOnly={!selectableType}
            maxLength={500}
            placeholder="Es. composizioni floreali e piccoli regali"
          />
        </div>
      )}
    </div>
  );
}
