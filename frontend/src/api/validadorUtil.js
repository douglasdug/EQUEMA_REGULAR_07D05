export const validarDato = (e, formData, setFormData) => {
  const { name, value } = e.target;
  let isValid = true;
  let formattedValue = value;

  if (e.target.type === "text") {
    formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
    //isValid = true; // Allow empty values for text inputs
  } else if (e.target.type === "number") {
    isValid = value > 0;
  } else if (e.target.type === "date") {
    isValid = !isNaN(new Date(value).getTime());
  } else if (e.target.type === "password") {
    formattedValue = value.replace(/\s/g, ""); // Remove spaces
    isValid = /^[A-Za-z0-9]*$/.test(formattedValue); // Allow only alphanumeric characters
  }

  if (isValid) {
    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  }
};

export const inputStyles = (disabled) => `
  shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
    disabled
      ? "bg-gray-200 text-gray-700 cursor-no-drop"
      : "bg-white text-gray-700 cursor-pointer"
  }`;

export const selectStyles = (disabled) => `
  block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline ${
    disabled
      ? "bg-gray-200 text-gray-700 cursor-no-drop"
      : "bg-white text-gray-700 cursor-pointer"
  }`;

export const buttonStyles = (disabled) => `
  ml-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-black ${
    disabled
      ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
      : "bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
  }`;
