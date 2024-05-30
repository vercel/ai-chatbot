interface InputProps {
  value: string | number
  onChange: () => void
  type: string
  name: string
  placeholder: string
}

export const Input = ({
  value,
  onChange,
  type,
  name,
  placeholder
}: InputProps) => {
  return (
    <input
      type={type}
      className="mt-1 block h-[45px] selection:bg-white w-full appearance-none bg-white rounded-md border text-black border-gray-200 px-3 py-2 placeholder-gray-400  focus:border-black focus:outline-none focus:ring-black sm:text-sm"
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
    ></input>
  )
}
