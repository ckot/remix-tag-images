import {
  ChangeEventHandler,
  MouseEventHandler,
  useEffect,
  useState,
} from "react";

import type { Option } from "~/utils";

interface MultiSelectProps {
  fieldName: string;
  size?: number;
  initialOptions: Option[];
  allOptions: Option[];
  setValuesDifferent?: React.Dispatch<React.SetStateAction<boolean>>;
}

function sortOptions(options: Option[]): Option[] {
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function valuesAreEqual(vals1: string[], vals2: string[]) {
  const set1 = new Set(vals1)
  const set2 = new Set(vals2)
  if (set1.size !== set2.size) {
    return false;
  } else {
    for (const v of set1.values()) {
      if (!set2.has(v)) {
        return false
      }
    }
    return true
  }
}

export default function MultiSelect({
  fieldName,
  size = 4,
  initialOptions,
  allOptions,
  setValuesDifferent,
}: MultiSelectProps) {
  const [options, setOptions] = useState(initialOptions as Option[]);
  const [searchTerm, setSearchTerm] = useState("");

  const isSelected = (value: string) =>
    options.map((o) => o.value).includes(value);

  const matchesSearchTerm = (label: string) =>
    label.toLowerCase().includes(searchTerm.toLowerCase());

  const updateSearchTerm: ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    setSearchTerm(event.currentTarget.value);
  };

  const clearSearchTerm: MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    event.preventDefault();
    setSearchTerm("");
  };


  const addOption: ChangeEventHandler<HTMLSelectElement> = async (event) => {
    event.preventDefault();
    const optionz = [...options];
    const selected = event.target.value;
    const toAdd = allOptions.find((ao: Option) => ao.value === selected);
    if (toAdd) {
      optionz.push(toAdd);
      setOptions(sortOptions(optionz));
    }
  };

  const removeOption: MouseEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    const toRemove = event.currentTarget.value;
    const optionz = options.filter((t) => t.value !== toRemove);
    setOptions(optionz);
  };

  // useEffect(() => {
  //   setOptions(initialOptions)
  // }, [initialOptions])

  useEffect(() => {
    if (setValuesDifferent) {
      setValuesDifferent(
        !valuesAreEqual(initialOptions.map((o) => o.value),
                        options.map((o) => o.value)
      ));
    }
  }, [options, initialOptions, setValuesDifferent])


  return (
    <>
      <div className="field is-grouped is-multiline">
        {options.map((o) => (
          <div key={o.value} className="control">
            <button
              className="tags has-addons"
              type="button"
              value={o.value}
              onClick={removeOption}
            >
              <span className="tag is-success">{o.label}</span>
              <span className="tag is-delete"></span>
            </button>
          </div>
        ))}
      </div>
      <div className="field has-addons">
        <div className="control">
          <input
            className="input"
            type="text"
            autoComplete="off"
            placeholder="Search for tags"
            value={searchTerm}
            onChange={updateSearchTerm}
          />
        </div>
        <div className="control">
          <button type="button" className="button" onClick={clearSearchTerm}>
            <span className="tag is-delete"></span>
          </button>
        </div>
      </div>
      <div className="field">
        <div className="control">
          <select
            className="input"
            style={{
              height: "auto",
              appearance: "auto",
            }}
            name={fieldName}
            multiple
            size={size}
            value={options.map((o) => o.value)}
            defaultValue={[]}
            onChange={addOption}
          >
            {allOptions.map((o: Option) => (
              <option
                key={o.value}
                value={o.value}
                hidden={isSelected(o.value) || !matchesSearchTerm(o.label)}
              >
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
