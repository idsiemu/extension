export interface ICompany {
    code: string;
    name: string;
    url: string;
    encoding: string;
    interval: number;
    active: boolean;
    urls: ICompanyUrl[];
}

export interface ICompanyUrl {
    code: string;
    url: string;
    urlCode: string;
}

export interface ICompanyUrlByTag extends ICompanyUrl {
    detailTarget: string | null
}

export interface ICompanyUrlTag {
    tagId: number;
    type: string;
    tagName: string;
    processType: string;
    target: string;
    replace: string;
    unwantedTag: string;
}

