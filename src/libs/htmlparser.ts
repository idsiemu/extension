interface Item {
  classname: string;
  content: string[];
}

export default class HtmlParser {

  public prefix = 'becu-';

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

  public analyzeContentFromSelected(selected: any[]) {
    if (selected === undefined || selected.length < 1) return;

    let contents = [];
    let commonXPath = ''; // root class 확인

    // 최상위 클래스 요소를 추출해서 하위 데이터를 분석하도록 정리
    let elems: NodeListOf<Element> | null = null;
    let rootClass = null;
    if (selected.length > 1) {
      try {
        commonXPath = this.findCommonXPath(selected.map(item => item.xpath));
        rootClass = this.extractLastClassName(commonXPath);
        if (rootClass === null) {
          console.log('rootClass is null:', commonXPath);
          return [];
        }
        elems = document.body.querySelectorAll(`.${rootClass.replace(/  /g, ' ').replace(/ /g, '.')}`);
      }
      catch (e) {
        console.log('analyzeContentFromSelected error:', commonXPath, rootClass, e);
        return [];
      }
    }

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      let elements = [];

      // 선택된 요소가 2개 이상인 경우에는 xpath로 찾음
      if (selected.length > 1) {
        const currentXClass = item.xpath.replace(commonXPath, '');
        elements = this.findElementsByPartialClass(currentXClass, elems);
      }
      else elements = this.findElementsByPartialClass(item.classname, elems);

      if (elements.length < 1) continue;
      selected[i].count = elements.length;

      let content = [];
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j] as HTMLElement;
        const attrs = this.extractClassAndContent(element);
        content.push(this.processJsonData(attrs));
      }

      contents.push({ ...selected[i], content, link: item.link });
    }

    if (selected.length > 1) {
      const newContents: any[] = [];
      for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        for (let j = 0; j < item.content.length; j++) {
          const content = item.content[j];
          if (newContents[j] === undefined) newContents[j] = [];
          newContents[j].push(content[0]);
        }
      }
      // console.log(contents, newContents);
      contents[0].content = newContents;
    }

    return contents;
  }

  public getXPathOrigin(element: Element) {
    const paths = [];
    for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode as Element) {
      let index = 0;
      if (!element.id) {
        for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.tagName) index++;
        }
      }
      const tagName = element.tagName.toLowerCase();
      const idSelector = element.id ? `[@id="${element.id}"]` : null;
      const pathIndex = (index && !element.id ? `[${index + 1}]` : '');
      paths.unshift(`${tagName}${idSelector ?? ''}${pathIndex}`);
    }
    return paths.length ? `/${paths.join('/')}` : '';
  }

  public getXPath(element: Element) {
    const paths = [];
    for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode as Element) {
      let index = 0;
      for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) index++;
      }
      const tagName = element.nodeName.toLowerCase();
      const idSelector = element.id ? `[@id="${element.id}"]` : null; // id가 있는 경우 XPath에 추가
      const className = this.getRealClassname(element.className);
      const classSelector = className === null ? '' : `[@class="${className}"]`; // 클래스 이름을 XPath에 추가
      const pathIndex = (index ? `[${index + 1}]` : '');
      paths.unshift(`${tagName}${idSelector ?? classSelector}${pathIndex}`);
    }
    return paths.length ? `/${paths.join('/')}` : '';
  }

  public getCssSelectorPath(element: Element): string {
    const paths = [];
    let currentElement: Element | null = element;
    let foundId = false;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      const tagName = currentElement.nodeName.toLowerCase();

      // ID가 있는 경우
      if (currentElement.id) {
        paths.unshift(`#${currentElement.id}`);
        foundId = true;
        break; // ID를 찾았으면 중단
      }

      // 클래스가 있는 경우
      let selector = tagName;
      if (currentElement.className && typeof currentElement.className === 'string') {
        const classNames = currentElement.className.trim();
        if (classNames) {
          // 첫 번째 클래스만 사용 (선택적)
          const firstClass = classNames.split(/\s+/)[0];
          selector += `.${firstClass}`;
        }
      }

      paths.unshift(selector);
      currentElement = currentElement.parentElement;
    }

    // ID를 찾지 못했고 html까지 도달하지 않았다면 html까지 계속 올라감
    if (!foundId && currentElement) {
      while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentElement.nodeName.toLowerCase();
        paths.unshift(tagName);
        currentElement = currentElement.parentElement;
      }
    }

    return paths.join(' > ');
  }

  private findCommonXPath(xpaths: string[]): string {
    const splitXPaths = xpaths.map(xpath => xpath.split('/'));
    let commonXPath = splitXPaths[0];

    let minPos = 10000;
    for (let i = 1; i < splitXPaths.length; i++) {
      let j = 0;
      while (j < minPos && j < splitXPaths[i].length && commonXPath[j] === splitXPaths[i][j]) { j++; }
      if (j < minPos) minPos = j;
      commonXPath = commonXPath.slice(0, minPos);
    }

    return commonXPath.join('/');
  }

  public getRealClassname(classname: string) {
    try {
      if (typeof classname !== 'string') {
        if (classname['baseVal'] === undefined) return '';
        classname = classname['baseVal'];
      }

      if (classname.includes(this.prefix)) {
        const classes = classname.split(' ');
        // prefix 로 시작하는 클래스명을 제외하고 반환
        const filtered = classes.filter((item) => !item.startsWith(this.prefix) && item !== '');
        classname = filtered.join(' ');
      }

      // 2개 공백 이상 공백은 1개로 변경
      classname = classname.replace(/\s{2,}/g, ' ');
    } catch (e) {
      console.log('getRealClassname error:', classname, e);
      classname = '';
    }

    return classname.trim();
  }

  public extractImageFromElement(element: HTMLElement) {
    let src = element.getAttribute('src');
    if (!src) return;

    src = this.makeFullUrl(src);
    return src;
  }

  private processJsonData(data: any[]): Item[] {
    const processedData: Item[] = [];

    function processContent(content: any[], parentClassname?: string): void {
      content.forEach(subItem => {
        let classname = subItem.classname || parentClassname || '';

        // content가 객체인 경우에는 재귀적으로 처리
        if (typeof subItem.content === 'object') {
          processContent(subItem.content, classname);
        } else if (Array.isArray(subItem.content)) {
          // content가 배열인 경우에는 각 요소를 처리
          subItem.content.forEach((item: any) => { processContent([item], classname); });
        } else if (typeof subItem.content === 'string') {
          // content가 문자열인 경우 처리
          const dataItem: Item = { classname, content: [subItem.content] };

          // classname이 동일한 경우 하나로 묶음
          const existingItem = processedData.find(dataItem => dataItem.classname === classname);
          if (existingItem) existingItem.content.push(subItem.content);
          else processedData.push(dataItem);
        }
      });
    }

    processContent(data);
    return processedData;
  }

  private extractLastClassName(xpath: string) {
    // console.log('common xpath:', xpath);
    // Split the xpath into its components
    const components = xpath.split('/');
    const lastComponent = components[components.length - 1];
    const match = lastComponent.match(/@class="([^"]*)"/);
    // console.log('lastComponent:', lastComponent, match[1]);
    if (match) return match[1];
    return null;
  }

  public findElementsByPartialClass(classname: string, elems: NodeListOf<Element> | null): Element[] {
    const elements: Element[] = [];

    try {
      if (!elems) {
        document.querySelectorAll('*').forEach(element => {
          if (!(element instanceof HTMLElement)) return;
          if (element.className.includes(classname)) elements.push(element as HTMLElement);
        });
      }
      else {
        elems.forEach(elem => {
          let addFlag = false;
          let isXpath = false;

          elem.querySelectorAll('*').forEach((element: Element) => {
            if (!(element instanceof HTMLElement)) return;
            // xpath 인지 class 인지 확인 필요
            if (classname.includes('/') || classname.includes('[')) {
              isXpath = true;
              // xpath로 찾기
              const xpath = this.getXPath(element);
              // console.log('xpath1:', xpath);
              // console.log('xpath2:', classname);
              if (xpath.endsWith(classname)) {
                elements.push(element as HTMLElement);
                addFlag = true;
              }
            } else {
              // console.log('element:', element.className, classname);
              if (element.className.includes(classname)) {
                elements.push(element as HTMLElement);
                addFlag = true;
              }
            }
          });

          // 하위 요소에 class가 없는 경우 빈값으로 대체
          if (!addFlag) {
            const element = document.createElement('div');
            if (!isXpath) element.className = classname;
            elements.push(element);
          }
        });
      }
    }
    catch (e) {
      console.log('findElementsByPartialClass error:', e);
    }

    return elements;
  }

  private extractClassAndContent(element: HTMLElement) {
    const attrs = [];
    let content: any = null;
    let classname = element.className ? this.getRealClassname(element.className) : '';

    // 현재 노드가 링크인 경우 링크를 추출
    if (element.tagName === 'A') {
      content = this.extractLinkFromElement(element);
      attrs.push({ classname, content });
      content = null;
    }

    // 하위 노드가 있는지 확인
    // 하위 노드가 없으면 class, text를 추출
    if (element.childNodes.length === 0) {
      // 이미지 태그, 링크 태그인 경우 이미지 경로, 링크를 추가
      switch (element.tagName) {
        case 'IMG':
          content = this.extractImageFromElement(element as HTMLImageElement);
          break;
        case 'A':
          content = this.extractLinkFromElement(element);
          break;
        default:
          content = element.textContent?.trim() ?? '';
          break;
      }
      // if (content === null || content === undefined || content === '') return;
      attrs.push({ classname, content });
    } else {
      // 하위노드가 있으면 하위 노드를 분석
      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) content = childNode.textContent?.trim() ?? '';
        else if (childNode.nodeType === Node.ELEMENT_NODE) content = this.extractClassAndContent(childNode as HTMLElement);
        // content가 없으면 다음 요소로 넘어감
        // if (content === null || content === undefined || content === '') continue;
        if (typeof content === 'object') {
          if (content === null || content.length < 1) continue;
        }

        attrs.push({ classname, content });
      }
    }

    // 하위 노드에 class 가 없으면 상위 노드에서 class를 찾아서 추출
    return attrs;
  }

  private extractLinkFromElement(element: HTMLElement) {
    if (element.tagName !== 'A') {
      const a = element.querySelector('a');
      if (a) element = a;
    }

    let link = element.getAttribute('href');
    // href 속성이 없는 경우 부모 노드에서 찾음
    if (!link) {
      const parent = element.parentElement;
      if (parent) link = parent.getAttribute('href');
    }
    if (!link) return;
    return this.makeFullUrl(link);
  }

  private makeFullUrl(source: string) {
    if (source.startsWith('//')) return 'https:' + source;
    if (source.startsWith('/')) {
      const url = new URL(document.location.href);
      return url.origin + source;
    }
    return source;
  }
}
