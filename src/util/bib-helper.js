export const worksCited = (element, biblStruct) => {
  if (!element) return null;

  const itemArray = {};
  const items = element.querySelector('biblStruct')

  items.forEach(items => {
    const type = biblStruct.getAttribute('type')
    console.log(type)
  })

}