export type DisplayCondition = Record<string, Array<string | boolean>>;

export type DisplayOptions = {
    show?: DisplayCondition;
    hide?: DisplayCondition;
};

export type TypeOptions = {
    minValue?: number;
    maxValue?: number;
    multipleValues?: boolean;
    noExpression?: boolean;
    [key: string]: any;
};

export interface NodeOptionValue {
    name: string;
    value: string;
    description?: string;
}

export interface FixedCollectionEntry {
    name: string;
    displayName: string;
    values: NodeProperty[];
    placeholder?: string;
}

export interface NodeProperty {
    displayName: string;
    name: string;
    type: string; // string like "options", "fixedCollection", etc.
    default: any;
    description?: string;
    required?: boolean;
    placeholder?: string;
    hint?: string;
    noDataExpression?: boolean;
    isNodeSetting?: boolean;
    requiresDataPath?: "single" | "multiple";
    credentialTypes?: string[];
    displayOptions?: DisplayOptions;
    typeOptions?: TypeOptions;

    options?: Array<NodeOptionValue> | Array<FixedCollectionEntry>;
    values?: NodeProperty[]; // for nested fixedCollections
}

export interface NodeCredential {
    name: string;
    required: boolean;
    displayOptions?: DisplayOptions;
}

export interface Codex {
    categories: string[];
    subcategories: Record<string, string[]>;
    alias?: string[];
    resources?: {
        primaryDocumentation?: { url: string }[];
    };
}

export interface NodeIconUrl {
    light: string;
    dark: string;
}

export interface Node {
    name: string;
    displayName: string;
    subtitle?: string;
    group: string[];
    description?: string;
    defaultVersion?: number;
    version?: Array<number | string>;
    defaults: {
        name: string;
        color: string;
    };
    inputs: string[];
    outputs: string[];
    properties: NodeProperty[];
    credentials?: NodeCredential[];
    usableAsTool?: any;
    iconUrl?: NodeIconUrl;
    codex?: Codex;
    type?: string;
    x: number;
    y: number;
}
