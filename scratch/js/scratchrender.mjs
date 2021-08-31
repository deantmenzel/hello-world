/**
 * The static Render class is, in effect, the view in the classic model-view-controller application 
 * architecture model.
 */

class Render {

  static _customHTMLelements = [
    'user-unauthorised',
    'user-welcome',
    'strategy-alert',
    'market-status',
    'strategy-status-header',
    'strategy-status'
  ] 

  /**
   * Define all custom HTML elements and add them to the CustomElementRegistry. There must be a 
   * corresponding HTML template for each custom element. The name of the corresponding template 
   * must be identical to the component name.
   * @param {string} customElementName - Name of custom HTML element
   */
  static _defineCustomElement(customElementName) {
    customElements.define(customElementName,
      class extends HTMLElement {
        static get observedAttributes() {}
        constructor() {
          super();
          let template = document.querySelector(`#${customElementName}`)
          let instance = template.content.cloneNode(true);
          this.attachShadow({mode: 'open'}).appendChild(instance);
        }
        /**
         * Add a generic click event handler to all components. The element generating the click 
         * event (e.g. button) can have dataset attributes, and if so, the full dataset is 
         * transmitted with the event. If there is a data-event attribute, its value is adopted as 
         * the name of the custom event. If no data-event attribute, then the name of the custom 
         * event defaults to the name of the custom web component. This makes it easy for any other
         * web component to receive the data by putting a listener on the document object in its
         * constructor. The receiving web component can then invoke its own handler to operate on 
         * the data (which is the value of event.detail) sent from this web component.
         */
        connectedCallback() {
          this.shadowRoot.addEventListener('click', (event) => {
            let dataset = event.composedPath()[0].dataset;
            let eventname = (dataset.event !== undefined) ? dataset.event : this.localName;
            this.dispatchEvent(new CustomEvent(eventname, {
              bubbles: true,
              composed: true,
              detail: {
                'event': event, 
                'documentFragment': this.shadowRoot
              }
            }));
          })
        }
        disconnectedCallback() {}
        attributeChangedCallback(attrName, oldValue, newValue) {}
      }
    )
  }

  /**
   * Work through the array of custom web component names and define and register them.
   */
  static initialise() {
    this._customHTMLelements.forEach(element => this._defineCustomElement(element))
  }

  /**
   * Construct a component. Note that a component may be composed of multiple templates. If the 
   * data object parameter s configured with 'parent' and 'child' properties for this component, 
   * the constructor will automatically use a second template, named 'component-name-child' to 
   * build this compound web component. If there is no 'parent' and 'child' properties in the data 
   * object, then the default (simple) web component will be built.
   * COMPOUND COMPONENT conventions:
   *   component-name
   *   <template id="component-name">
   *   <template id="component-name-child">
   *   DB[component-name] // data for slots; must contain 'parent' and 'child' properties
   *   User.config[component-name] // field names for slots; must contain parent, child props
   *   Note that the child template is only used to create HTML fragment clones to be 
   *   inserted into the parent template of the registered web component. 
   * DEFAULT COMPONENT conventions:
   *   component-name
   *   <template id="component-name">
   *   (optional) DB[component-name] // data for slots 
   *   (optional) User.config[component-name] // field names for slots
   *   Data and field names are in arrays that correspond exactly with each other, and they must 
   *   NOT contain 'parent' and 'child' properties.
   * If no field names are provided, slots are named and referenced using the index of the data 
   * array. E.g. if a data array has 3 values, the value will go into slot 0, the second value will 
   * go into slot 1, the third into slot 2, etc.
   * @param componentname {string} Name of composite component. A component may be composed of a 
   * 'header' and 'body' web component, where each is prefixed by the component name.
   * @param destination {HTMLElement} The HTML document element that the component is to be 
   * appended to.
   * @param data {object} The data array(s) for the trading day.
   * @param user {object} The user object which contians configured field label data array(s)
   */
  constructor(componentname, destination, data, fieldnames) {
    this._componentname = componentname;
    this._component = document.createElement(componentname);
    this._fields = fieldnames && fieldnames.config[componentname];
    this._data = (data && data[componentname]) || data;
    if(this._data && this._data.parent !== undefined && this._data.child !== undefined) {
      destination.appendChild(this._component);
      this._buildGrid();
    } else {
      if(this._data !== undefined) {
        this._data.forEach((value, index) => {
          let fieldname = (this._fields && this._fields[index]) || index;
          this._component.appendChild(this._addSlot(fieldname, value));
        })    
      }
      destination.appendChild(this._component);
    }
  }

  /**
   * This function is fired from the constructor for a compound component that is made up of a 
   * parent and child templates. The typical scenario is a table (parent) and a row (child) 
   * template that is repeatedly inserted into the table. This is necessary because HTML rules 
   * restrict <slot> elements to be placed as children of <table>, <tbody>, <tr> elements. So the 
   * concept of building a table 'row by row' using slots is not possible, it can only be built 
   * 'cell-by-cell'. Therefore, every slot for every cell must have a unique name, and this cannot 
   * be done with native web component functionality alone because we don't know how many rows the 
   * table has and how many cells in each table. This function handles all of that.
   * Note the [data-parent] and [data-child] attribute which specifies the top-level node in the 
   *  cloned header and body templates to which child nodes are appended. 
   */
  _buildGrid() {
    let parentslots = this._component.shadowRoot.querySelectorAll('slot');
    this._data.parent.forEach((value, index) => {
      let fieldname = (this._fields && this._fields.parent[index]) || index;
      parentslots[index].setAttribute('name', fieldname);
      this._component.appendChild(this._addSlot(fieldname, value));
    })
    let childtemplate = document.querySelector(`#${this._componentname}-child`);
    this._data.child.forEach((set, setindex) => {
      let childclone = childtemplate.content.querySelector('[data-child]').cloneNode(true);
      let slots = childclone.querySelectorAll('slot');
      set.forEach((value, index) => {
        let fieldname = 
          (this._fields && this._fields.child[setindex][index]) || `${setindex}-${index}`;
        slots[index].setAttribute(`name`, fieldname);
        this._component.appendChild(this._addSlot(fieldname, value));
      })
      this._component.shadowRoot.querySelector('[data-parent]').appendChild(childclone);
    })
  }

  /**
   * Generate a single HTML element to fill the specified slot of a template.
   * @param {string} fieldname - Name of slot.
   * @param {object} data - Either a string value to be inserted into a text node, or an object 
   * consisting of value, htmlelement and attributes properties, which are used to construct a 
   * fully-defined html element. That is: data = { 
   *    value : a string to insert into the text node of the html element
   *    htmlelement: a valid html element e.g. a, span, p, etc.
   *    attributes: key=value pairs separated by semi-colons
   * }
   * Descendant nodes of slots cannot be styled with CSS. Therefore, best practice is that a slot 
   * is filled with either a text node, or one and only one html element. 
   * @returns {HTMLelement} htmlelement - An HTML element, either <slot> or <tag> as specified 
   * by the data parameter.
   */
  _addSlot(fieldname, data) {
    let value = (data.htmlelement) ? data.value : data; 
    let attributes = (data.attributes) || null;
    let htmlelement = document.createElement((data.htmlelement) || 'slot');
    htmlelement.innerHTML = value;
    attributes = `slot=${fieldname}` + ((attributes !== null) ? `;${attributes}` : ``);
    attributes.split(';').forEach((attr) => {
      let pair = attr.split('=');
      htmlelement.setAttribute(pair[0], pair[1]);
    })
    return htmlelement;
  }





  /**
   * Public method for rendering a component. It captures whether or not a fix is required for when 
   * rows are being inserted into a table from another custom web component through a slot. If this 
   * is not done, rows will be hoisted outside of the table because of HTML permitted content rules.
   * @param {HTMLElement} destination - A valid HTML element on the page, after which the component 
   * will be rendered.
   * @param {Arry} data - Array of values with known dimensions, web component name at [0]
   */
  // static component(destination, data) {
  //   const tablecomponentname = data[0];
  //   const rowcomponentname = document.querySelector(`#${data[0]}`).dataset.rowComponent;
  //   this._component(destination, data);
  //   if(rowcomponentname !== undefined) this._fixSlottedRows(tablecomponentname, rowcomponentname);
  // }

  /**
   * Generate a single HTML element to fill the specified slot of a template.
   * @param {string} value - Data to be inserted into slot's text node.
   * @param {string} slot - Name of slot.
   * @param {string=} element - Name of HTML element to create. If not specified default to the 
   * slot HTML element
   * @param {*string=} attributes - String of key=value pairs separated by semicolon.
   * @returns {HTMLelement} element - An HTML element, either <slot> or <tagName> as specified by 
   * the tagName parameter of the function
   */
  // static _fillSlot(value, slot, element, attributes) {
  //   element = document.createElement(element || 'slot');
  //   element.appendChild(document.createTextNode(value));
  //   attributes = `slot=${slot}` + ((attributes !== undefined) ? `;${attributes}` : ``);
  //   attributes.split(';').forEach((attr) => {
  //     let pair = attr.split('=');
  //     element.setAttribute(pair[0], pair[1]);
  //   })
  //   return element;
  // }

  /**
   * Create a custom web component from an HTML template with slots. Recursive. Argument data 
   * contains an array with data that can be multiple levels deep. Each level must have its custom 
   * web component id specified at array index 0. Slots are numbered to bind with the array index 
   * of the data that will fill them. E.g. <slot name="0"> will fill with data from array index 0.
   * @param {array} data - Array of values with known dimensions, web component name at [0]
   * @param {HTMLelement} destination - A valid HTML element on the page
   * @param {string=} slot - For a child COMPONENT: name of slot in parent web component.
   */
  // static _component(destination, data, slot) {
  //   let component = document.createElement(data[0]);
  //   // Must give a slot attribute to a child web component otherwise it will not render!
  //   if(slot !== undefined) component.setAttribute('slot', slot)
  //   // If data item is an array then we need to traverse to the next level down.
  //   data.slice(1).forEach((item, index) => {
  //     if(Array.isArray(item)) {
  //       item.forEach((subitem) => this._component(component, subitem, index))
  //     } else {
  //       component.appendChild(this._fillSlot(item, index))
  //     }
  //   })
  //   destination.appendChild(component);
  // }

  /**
   * HTML has strict rules on <tr> and <tbody> elements. <tbody> can only contain <tr> elements and 
   * <tr> elements can only contain <td> or <th> elements. They cannot contain <slot> elements, 
   * therefore, it is not possible to natively fill a table row-by-row with HTML templates and 
   * slots. When this is attemped, the <tbody>s or <tr>s are 'hoisted' out of the table. So, build 
   * rows, accepting that they are hoisted out, and then manipulate the light and shadow DOMs with 
   * javascript. 
   * @param {string} tablecomponentname - Name of table (parent) web component. It must have one 
   * and only one <table> in its associated template.
   * @param {string} rowcomponentname - Name of row (child) web component. It must have one and 
   * only one <tbody> and/or <tr> element in its associated template.
   */
  // static _fixSlottedRows(tablecomponentname, rowcomponentname) {
  //   let table = document.querySelector(tablecomponentname).shadowRoot.querySelector('table');
  //   let tbodycomponents = document.querySelectorAll(rowcomponentname);
  //   tbodycomponents.forEach((component) => {
  //     let merged = '';
  //     let slots = component.querySelectorAll('slot');
  //     let tds = component.shadowRoot.querySelectorAll('td');
  //     tds.forEach((td) => {
  //       let value; 
  //       let slotname = td.querySelector('slot').attributes['name']['value'];
  //       slots.forEach((slot) => {if(slot['slot'] == slotname) value = slot.innerText});
  //       merged = `${merged}<td>${value}</td>`;
  //     })
  //     table.insertAdjacentHTML('beforeend', `<tbody><tr>${merged}</tr></tbody>`);
  //   })
  // }

}

export { Render }