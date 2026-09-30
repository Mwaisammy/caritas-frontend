import type {Member, RelationshipType} from "@/lib/go-api-client";
import {Field, type FieldErrors, inputClass, selectClass} from "./form-shared";

const relationships: Array<{value: RelationshipType; label: string}> = [
  {value: "RELATIONSHIP_TYPE_SPOUSE", label: "Spouse"},
  {value: "RELATIONSHIP_TYPE_CHILD", label: "Child"},
  {value: "RELATIONSHIP_TYPE_PARENT", label: "Parent"},
  {value: "RELATIONSHIP_TYPE_SIBLING", label: "Sibling"},
  {value: "RELATIONSHIP_TYPE_FRIEND", label: "Friend"},
  {value: "RELATIONSHIP_TYPE_OTHER", label: "Other"},
];

function errorProps(errors: FieldErrors | undefined, name: string) {
  return {
    "aria-describedby": errors?.[name] ? `${name}-error` : undefined,
    "aria-invalid": Boolean(errors?.[name]),
  };
}

export function ProfileFields({member, errors}: {member?: Member; errors?: FieldErrors}) {
  const personal = member?.profile?.personal;
  const employment = member?.profile?.employment;
  const identification = member?.profile?.idDocument;
  const nextOfKin = member?.profile?.nextOfKin;
  const dateOfBirth = personal?.dateOfBirth?.slice(0, 10) ?? "";

  return (
    <div className="space-y-7">
      <section>
        <SectionHeading title="Personal information" description="Identity and primary contact details." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName" error={errors?.fullName}><input {...errorProps(errors, "fullName")} className={inputClass} defaultValue={personal?.fullName} id="fullName" name="fullName" required /></Field>
          {!member ? <Field label="National ID" name="nationalId" error={errors?.nationalId}><input {...errorProps(errors, "nationalId")} className={inputClass} id="nationalId" name="nationalId" required /></Field> : null}
          <Field label="Phone number" name="phone" error={errors?.phone}><input {...errorProps(errors, "phone")} className={inputClass} defaultValue={personal?.phone} id="phone" name="phone" required type="tel" /></Field>
          <Field label="Email address" name="email" error={errors?.email}><input {...errorProps(errors, "email")} className={inputClass} defaultValue={personal?.email} id="email" name="email" type="email" /></Field>
          <Field label="Date of birth" name="dateOfBirth" error={errors?.dateOfBirth}><input {...errorProps(errors, "dateOfBirth")} className={inputClass} defaultValue={dateOfBirth} id="dateOfBirth" name="dateOfBirth" required type="date" /></Field>
          <div className={member ? "sm:col-span-2" : ""}><Field label="Residential address" name="address" error={errors?.address}><input {...errorProps(errors, "address")} className={inputClass} defaultValue={personal?.address} id="address" name="address" required /></Field></div>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-6">
        <SectionHeading title="Employment & income" description="Current occupation and declared monthly income." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Occupation" name="occupation" error={errors?.occupation}><input {...errorProps(errors, "occupation")} className={inputClass} defaultValue={employment?.occupation} id="occupation" name="occupation" required /></Field>
          <Field label="Employer" name="employer" error={errors?.employer}><input {...errorProps(errors, "employer")} className={inputClass} defaultValue={employment?.employer} id="employer" name="employer" required /></Field>
          <Field label="Monthly income" name="monthlyIncome" error={errors?.monthlyIncome}><input {...errorProps(errors, "monthlyIncome")} className={inputClass} defaultValue={employment?.monthlyIncome?.units} id="monthlyIncome" inputMode="numeric" min="0" name="monthlyIncome" required type="number" /></Field>
          <Field label="Currency" name="currencyCode" error={errors?.currencyCode}><input {...errorProps(errors, "currencyCode")} className={inputClass} defaultValue={employment?.monthlyIncome?.currencyCode ?? "KES"} id="currencyCode" maxLength={3} name="currencyCode" required /></Field>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-6">
        <SectionHeading title="Identification document" description="Government-issued supporting document." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document type" name="idType" error={errors?.idType}><input {...errorProps(errors, "idType")} className={inputClass} defaultValue={identification?.type ?? "National ID"} id="idType" name="idType" required /></Field>
          <Field label="Document number" name="idNumber" error={errors?.idNumber}><input {...errorProps(errors, "idNumber")} className={inputClass} defaultValue={identification?.number} id="idNumber" name="idNumber" required /></Field>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-6">
        <SectionHeading title="Next of kin" description="Emergency contact and relationship." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="nextOfKinName" error={errors?.nextOfKinName}><input {...errorProps(errors, "nextOfKinName")} className={inputClass} defaultValue={nextOfKin?.name} id="nextOfKinName" name="nextOfKinName" required /></Field>
          <Field label="Phone number" name="nextOfKinPhone" error={errors?.nextOfKinPhone}><input {...errorProps(errors, "nextOfKinPhone")} className={inputClass} defaultValue={nextOfKin?.phone} id="nextOfKinPhone" name="nextOfKinPhone" required type="tel" /></Field>
          <Field label="Relationship" name="relationship" error={errors?.relationship}>
            <select {...errorProps(errors, "relationship")} className={selectClass} defaultValue={nextOfKin?.relationship ?? "RELATIONSHIP_TYPE_OTHER"} id="relationship" name="relationship">
              {relationships.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({title, description}: {title: string; description: string}) {
  return <div className="mb-4"><h3 className="font-semibold text-stone-950">{title}</h3><p className="text-xs text-stone-500">{description}</p></div>;
}
