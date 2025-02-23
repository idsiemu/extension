export default class HtmlParser {
  public resetXpath = (xpath = "") => {
    if (xpath === "") return "";
    try {
      xpath = xpath.replace(/\[@class=".*?"\]/g, "");
    } catch (e) {
      return xpath;
    }

    const lastIndex = xpath.lastIndexOf("@id");
    if (lastIndex < 0) return xpath;

    const modifiedXPath = "//*[" + xpath.substring(lastIndex, xpath.length);
    return modifiedXPath;
  };

  public getXPathElement = async (xpath: string) => {
    xpath = this.resetXpath(xpath);
    console.log("clickElementByXPath:", xpath);

    let element: any = null;
    const maxAttempts = 9;
    let attempts = -1;

    while (attempts < maxAttempts) {
      element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 999)); // wait for 1 second
      attempts++;
    }
    if (element === null) return;

    return element;
  };
}
