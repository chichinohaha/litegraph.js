/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/ban-types */

export type Vector2 = [number, number];
export type Vector4 = [number, number, number, number];
export type widgetTypes =
    | "number"
    | "slider"
    | "combo"
    | "text"
    | "toggle"
    | "button";
export type SlotShape =

    | typeof LiteGraph.BOX_SHAPE
    | typeof LiteGraph.ROUND_SHAPE
    | typeof LiteGraph.CIRCLE_SHAPE
    | typeof LiteGraph.CARD_SHAPE
    | typeof LiteGraph.ARROW_SHAPE
    | number; // For custom shapes

/** https://github.com/jagenjo/litegraph.js/tree/master/guides#node-slots */
export interface INodeSlot {
    name: string;
    type: string | -1;
    label?: string;
    dir?:
        | typeof LiteGraph.UP
        | typeof LiteGraph.RIGHT
        | typeof LiteGraph.DOWN
        | typeof LiteGraph.LEFT;
    color_on?: string;
    color_off?: string;
    shape?: SlotShape;
    locked?: boolean;
    nameLocked?: boolean;
}

export interface INodeInputSlot extends INodeSlot {
    pos: boolean;
    link: LLink["id"] | null;
}
export interface INodeOutputSlot extends INodeSlot {
    _data?: any;
    pos?: boolean;
    links: LLink["id"][] | null;
}

export type WidgetCallback<T extends IWidget = IWidget> = (
    this: T,
    value: T["value"],
    graphCanvas: LGraphCanvas,
    node: LGraphNode,
    pos: Vector2,
    event?: MouseEvent
) => void;

export interface IWidget<TValue = any, TOptions = any> {
    name: string | null;
    value: TValue;
    options?: TOptions;
    type?: widgetTypes;
    y?: number;
    property?: string;
    last_y?: number;
    clicked?: boolean;
    marker?: boolean;
    callback?: WidgetCallback<this>;
    /** Called by `LGraphCanvas.drawNodeWidgets` */
    draw?(
        ctx: CanvasRenderingContext2D,
        node: LGraphNode,
        width: number,
        posY: number,
        height: number
    ): void;
    /**
     * Called by `LGraphCanvas.processNodeWidgets`
     * https://github.com/jagenjo/litegraph.js/issues/76
     */
    mouse?(
        event: MouseEvent,
        pos: Vector2,
        node: LGraphNode
    ): boolean;
    /** Called by `LGraphNode.computeSize` */
    computeSize?(width: number): [number, number];
}
export interface IButtonWidget extends IWidget<null, {}> {
    type: "button";
}
export interface IToggleWidget
    extends IWidget<boolean, { on?: string; off?: string }> {
    type: "toggle";
}
export interface ISliderWidget
    extends IWidget<number, { max: number; min: number }> {
    type: "slider";
}
export interface INumberWidget extends IWidget<number, { precision: number }> {
    type: "number";
}
export interface IComboWidget
    extends IWidget<
        string[],
        {
            values:
                | string[]
                | ((widget: IComboWidget, node: LGraphNode) => string[]);
        }
    > {
    type: "combo";
}

export interface ITextWidget extends IWidget<string, {}> {
    type: "text";
}

export interface IContextMenuItem {
    content: string;
    callback?: ContextMenuEventListener;
    /** Used as innerHTML for extra child element */
    title?: string;
    disabled?: boolean;
    has_submenu?: boolean;
    submenu?: {
        options: ContextMenuItem[];
    } & IContextMenuOptions;
    className?: string;
}
export interface IContextMenuOptions {
    className?: string;
    callback?: ContextMenuEventListener;
    ignore_item_callbacks?: Boolean;
    event?: MouseEvent | CustomEvent|null;
    parentMenu?: ContextMenu|null;
    autoopen?: boolean;
    title?: string;
    extra?: any;
    scroll_speed?:number
}

export type ContextMenuItem = IContextMenuItem | null;
export type ContextMenuEventListener = (
    value: ContextMenuItem,
    options: IContextMenuOptions,
    event: MouseEvent,
    parentMenu: ContextMenu | undefined,
    node: LGraphNode
) => boolean | void;


// used by some widgets to render a curve editor
class CurveEditor
{
    points: any;
    selected: number;
    nearest: number;
    size: number[];
    must_update: boolean;
    margin: number;
    _nearest?: number;
    constructor(points: any){
        this.points = points;
        this.selected = -1;
        this.nearest = -1;
        //@ts-ignore
        this.size = null; // stores last size used
        this.must_update = true;
        this.margin = 5;
    }
    draw(ctx: { save: () => void; translate: (arg0: number, arg1: number) => void; fillStyle: string; fillRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; strokeStyle: string; strokeRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; globalAlpha: number; beginPath: () => void; lineTo: (arg0: number, arg1: number) => void; stroke: () => void; arc: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; fill: () => void; restore: () => void; }, size: number[], graphcanvas: any, background_color: any, line_color: string, inactive: any)
{
    const points = this.points;
    if (!points)
    { return; }
    this.size = size;
    const w = size[0] - this.margin * 2;
    const h = size[1] - this.margin * 2;

    line_color = line_color || '#666';

    ctx.save();
    ctx.translate(this.margin, this.margin);

    if (background_color)
    {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#222';
        ctx.fillRect(w * 0.5, 0, 1, h);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(0, 0, w, h);
    }
    ctx.strokeStyle = line_color;
    if (inactive)
    { ctx.globalAlpha = 0.5; }
    ctx.beginPath();
    for (var i = 0; i < points.length; ++i)
    {
        var p = points[i];
        ctx.lineTo(p[0] * w, (1.0 - p[1]) * h);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (!inactive)
    { for (var i = 0; i < points.length; ++i)
    {
        var p = points[i];
        ctx.fillStyle = this.selected == i ? '#FFF' : (this.nearest == i ? '#DDD' : '#AAA');
        ctx.beginPath();
        ctx.arc(p[0] * w, (1.0 - p[1]) * h, 2, 0, Math.PI * 2);
        ctx.fill();
    } }
    ctx.restore();
};

// localpos is mouse in curve editor space
onMouseDown(localpos: number[], graphcanvas: { ds: { scale: number; }; })
{
    const points = this.points;
    if (!points)
    { return; }
    if (localpos[1] < 0)
    { return; }

    // this.captureInput(true);
    const w = this.size[0] - this.margin * 2;
    const h = this.size[1] - this.margin * 2;
    const x = localpos[0] - this.margin;
    const y = localpos[1] - this.margin;
    const pos = [x, y];
    const max_dist = 30 / graphcanvas.ds.scale;
    // search closer one
    this.selected = this.getCloserPoint(pos, max_dist);
    // create one
    if (this.selected == -1)
    {
        const point = [x / w, 1 - y / h];
        points.push(point);
        points.sort(function(a: number[], b: number[]) { return a[0] - b[0]; });
        this.selected = points.indexOf(point);
        this.must_update = true;
    }
    if (this.selected != -1)
    { return true; }
};

onMouseMove(localpos: number[], graphcanvas: { ds: { scale: number; }; })
{
    const points = this.points;
    if (!points)
    { return; }
    const s = this.selected;
    if (s < 0)
    { return; }
    const x = (localpos[0] - this.margin) / (this.size[0] - this.margin * 2);
    const y = (localpos[1] - this.margin) / (this.size[1] - this.margin * 2);
    const curvepos = [(localpos[0] - this.margin), (localpos[1] - this.margin)];
    const max_dist = 30 / graphcanvas.ds.scale;
    this._nearest = this.getCloserPoint(curvepos, max_dist);
    const point = points[s];
    if (point)
    {
        const is_edge_point = s == 0 || s == points.length - 1;
        if (!is_edge_point && (localpos[0] < -10 || localpos[0] > this.size[0] + 10 || localpos[1] < -10 || localpos[1] > this.size[1] + 10))
        {
            points.splice(s, 1);
            this.selected = -1;
            return;
        }
        if (!is_edge_point) // not edges
        { point[0] = Math.clamp(x, 0, 1); }
        else
        { point[0] = s == 0 ? 0 : 1; }
        point[1] = 1.0 - Math.clamp(y, 0, 1);
        points.sort(function(a: number[], b: number[]) { return a[0] - b[0]; });
        this.selected = points.indexOf(point);
        this.must_update = true;
    }
};

onMouseUp(localpos: any, graphcanvas: any)
{
    this.selected = -1;
    return false;
};

getCloserPoint(pos: number[], max_dist: number)
{
    const points = this.points;
    if (!points)
    { return -1; }
    max_dist = max_dist || 30;
    const w = (this.size[0] - this.margin * 2);
    const h = (this.size[1] - this.margin * 2);
    const num = points.length;
    const p2 = [0, 0];
    let min_dist = 1000000;
    let closest = -1;
    let last_valid = -1;
    for (let i = 0; i < num; ++i)
    {
        const p = points[i];
        p2[0] = p[0] * w;
        p2[1] = (1.0 - p[1]) * h;
        if (p2[0] < pos[0])
        { last_valid = i; }
        //@ts-ignore
        const dist = vec2.distance(pos, p2);
        if (dist > min_dist || dist > max_dist)
        { continue; }
        closest = i;
        min_dist = dist;
    }
    return closest;
};

static sampleCurve = function(f: number, points: string | any[])
{
    if (!points)
    { return; }
    for (let i = 0; i < points.length - 1; ++i)
    {
        const p = points[i];
        const pn = points[i + 1];
        if (pn[0] < f)
        { continue; }
        const r = (pn[0] - p[0]);
        if (Math.abs(r) < 0.00001)
        { return p[1]; }
        const local_f = (f - p[0]) / r;
        return p[1] * (1.0 - local_f) + pn[1] * local_f;
    }
    return 0;
};

}
type SerializedLLink = [number, number, number, number, number, number];
// this is the class in charge of storing link information
class LLink {
    _data: null;
    _pos: Float32Array;
    _last_time: any;
    data: any;
    constructor(id?: number , type?: number, origin_id?: number , origin_slot?: number, target_id?: number , target_slot?: number ) {
        this.id = id||-1;
        this.type = type||-1;
        this.origin_id = origin_id||-1;
        this.origin_slot = origin_slot||-1;
        this.target_id = target_id||-1;
        this.target_slot = target_slot||-1;

        this._data = null;
        this._pos = new Float32Array(2); // center
    }
    id:number
    type:number
    origin_id:number
    origin_slot:number
    target_id:number
    target_slot:number
    configure(o:LLink|SerializedLLink) {
        if (o.constructor === Array) {
            this.id = o[0];
            this.origin_id = o[1];
            this.origin_slot = o[2];
            this.target_id = o[3];
            this.target_slot = o[4];
            this.type = o[5];
        } else if( o instanceof LLink){
            this.id = o.id;
            this.type = o.type;
            this.origin_id = o.origin_id;
            this.origin_slot = o.origin_slot;
            this.target_id = o.target_id;
            this.target_slot = o.target_slot;
        }
    }
    serialize():SerializedLLink {
        return [
            this.id,
            this.origin_id,
            this.origin_slot,
            this.target_id,
            this.target_slot,
            this.type,
        ];
    }
}

class LiteGraph {
    static LGraphNode: typeof LGraphNode;
    static DragAndScale: typeof DragAndScale;
    static closeAllContextMenus(ref_window: any) {
        throw new Error("Method not implemented.");
    }
    static isInsideRectangle(arg0: any, arg1: any, x: any, y: any, w: any, h: any) {
        throw new Error("Method not implemented.");
    }
    static ContextMenu: any;
    static DEFAULT_GROUP_FONT_SIZE: any;
    static LGraphCanvas: typeof LGraphCanvas;
    static compareObjects: (a: any, b: any) => boolean;
    static distance: (a: any, b: any) => number;
    static colorToString: (c: any) => string;
    static growBounding: (bounding: any, x: any, y: any) => void;
    static isInsideBounding: (p: any, bb: any) => boolean;
    static overlapBounding: (a: any, b: any) => boolean;
    static hex2num: (hex: any) => any[];
    static num2hex: (triplet: any) => string;

    static VERSION = 0.4
    static CANVAS_GRID_SIZE = 10
    static NODE_TITLE_HEIGHT = 30
    static NODE_TITLE_TEXT_Y = 20
    static NODE_SLOT_HEIGHT = 20
    static NODE_WIDGET_HEIGHT = 20
    static NODE_WIDTH = 140
    static NODE_MIN_WIDTH = 50
    static NODE_COLLAPSED_RADIUS = 10
    static NODE_COLLAPSED_WIDTH = 80
    static NODE_TITLE_COLOR = '#999'
    static NODE_SELECTED_TITLE_COLOR = '#FFF'
    static NODE_TEXT_SIZE = 14
    static NODE_TEXT_COLOR = '#AAA'
    static NODE_SUBTEXT_SIZE = 12
    static NODE_DEFAULT_COLOR = '#333'
    static NODE_DEFAULT_BGCOLOR = '#353535'
    static NODE_DEFAULT_BOXCOLOR = '#666'
    static NODE_DEFAULT_SHAPE = 'box'
    static NODE_BOX_OUTLINE_COLOR = '#FFF'
    static DEFAULT_SHADOW_COLOR = 'rgba(0,0,0,0.5)'
    static DEFAULT_GROUP_FONT = 24

    static WIDGET_BGCOLOR = '#222'
    static WIDGET_OUTLINE_COLOR = '#666'
    static WIDGET_TEXT_COLOR = '#DDD'
    static WIDGET_SECONDARY_TEXT_COLOR = '#999'

    static LINK_COLOR = '#9A9'
    static EVENT_LINK_COLOR = '#A86'
    static CONNECTING_LINK_COLOR = '#AFA'

    static MAX_NUMBER_OF_NODES = 1000 // avoid infinite loops
    static DEFAULT_POSITION = [100, 100] // default node position
    static VALID_SHAPES = ['default', 'box', 'round', 'card'] // "circle"

    // shapes are used for nodes but also for slots
    static BOX_SHAPE = 1
    static ROUND_SHAPE = 2
    static CIRCLE_SHAPE = 3
    static CARD_SHAPE = 4
    static ARROW_SHAPE = 5

    // enums
    static INPUT = 1
    static OUTPUT = 2

    static EVENT = -1 // for outputs
    static ACTION = -1 // for inputs

    static ALWAYS = 0
    static ON_EVENT = 1
    static NEVER = 2
    static ON_TRIGGER = 3

    static UP = 1
    static DOWN = 2
    static LEFT = 3
    static RIGHT = 4
    static CENTER = 5

    static STRAIGHT_LINK = 0
    static LINEAR_LINK = 1
    static SPLINE_LINK = 2

    static NORMAL_TITLE = 0
    static NO_TITLE = 1
    static TRANSPARENT_TITLE = 2
    static AUTOHIDE_TITLE = 3

    static proxy = null // used to redirect calls
    static node_images_path = ''

    static debug = false
    static catch_exceptions = true
    static throw_errors = true
    /**
     * if set to true some nodes like Formula would be allowed to evaluate code that comes from unsafe sources (like node configuration), which could lead to exploits
     */
    static allow_scripts = false
    /**
     * nodetypes by string
     */
    static registered_node_types:Record<string, any> = {}
    /**
     * used for dropping files in the canvas
     */
    static node_types_by_file_extension:Record<string, any> = {}
    /**
     * node types by classname
     */
    static Nodes:Record<string, any> = {}
    /**
     * used to store vars between graphs 
     */
    static Globals:Record<string, any> = {}
    /**
     * used to add extra features to the search box
     */
    static searchbox_extras:Record<string, any> = {}
    /**
     * If set to true, will automatically sort node types / categories in the context menus
     */
    static auto_sort_node_types = false
    static onNodeTypeRegistered: any
    static onNodeTypeReplaced: any
    static Subgraph: any
    static LGraphGroup: any
    static LGraph: typeof LGraph
    static LLink = LLink;
    /**
     * Register a node class so it can be listed when the user wants to create a new one
     * @method registerNodeType
     * @param {String} type name of the node and path
     * @param {Class} base_class class containing the structure of a node
     */

    static registerNodeType(type:string, base_class:Function&any) {
        if (!base_class.prototype) {
            throw 'Cannot register a simple object, it must be a class with a prototype';
        }
        base_class.type = type;

        if (LiteGraph.debug) {
            console.log('Node registered: ' + type);
        }

        const categories = type.split('/');
        const classname = base_class.name;

        const pos = type.lastIndexOf('/');
        base_class.category = type.substr(0, pos);

        if (!base_class.title) {
            base_class.title = classname;
        }
        // info.name = name.substr(pos+1,name.length - pos);

        // extend class
        if (base_class.prototype) {
            // is a class
            for (const i in LGraphNode.prototype) {
                if (!base_class.prototype[i]) {
                    //@ts-ignore
                    base_class.prototype[i] = LGraphNode.prototype[i];
                }
            }
        }

        const prev = this.registered_node_types[type];
        if (prev) { console.log('replacing node type: ' + type); }
        else {
            if (!Object.hasOwnProperty.call(base_class.prototype, 'shape')) {
                Object.defineProperty(base_class.prototype, 'shape', {
                    set: function(v) {
                        switch (v) {
                            case 'default':
                                delete this._shape;
                                break;
                            case 'box':
                                this._shape = LiteGraph.BOX_SHAPE;
                                break;
                            case 'round':
                                this._shape = LiteGraph.ROUND_SHAPE;
                                break;
                            case 'circle':
                                this._shape = LiteGraph.CIRCLE_SHAPE;
                                break;
                            case 'card':
                                this._shape = LiteGraph.CARD_SHAPE;
                                break;
                            default:
                                this._shape = v;
                        }
                    },
                    get: function() {
                        return this._shape;
                    },
                    enumerable: true,
                    configurable: true,
                });
            }

            // warnings
            if (base_class.prototype.onPropertyChange) {
                console.warn(
                    'LiteGraph node class ' +
                    type +
                    ' has onPropertyChange method, it must be called onPropertyChanged with d at the end'
                );
            }

            // used to know which nodes create when dragging files to the canvas
            if (base_class.supported_extensions) {
                for (const i in base_class.supported_extensions) {
                    const ext = base_class.supported_extensions[i];
                    if (ext && ext.constructor === String) { this.node_types_by_file_extension[ext.toLowerCase()] = base_class; }
                }
            }
        }

        this.registered_node_types[type] = base_class;
        if (base_class.constructor.name) {
            this.Nodes[classname] = base_class;
        }
        if (LiteGraph.onNodeTypeRegistered) {
            LiteGraph.onNodeTypeRegistered(type, base_class);
        }
        if (prev && LiteGraph.onNodeTypeReplaced) {
            LiteGraph.onNodeTypeReplaced(type, base_class, prev);
        }

        // warnings
        if (base_class.prototype.onPropertyChange) {
            console.warn(
                'LiteGraph node class ' +
                type +
                ' has onPropertyChange method, it must be called onPropertyChanged with d at the end'
            );
        }

        // used to know which nodes create when dragging files to the canvas
        if (base_class.supported_extensions) {
            for (let i = 0; i < base_class.supported_extensions.length; i++) {
                const ext = base_class.supported_extensions[i];
                if (ext && ext.constructor === String) { this.node_types_by_file_extension[ext.toLowerCase()] = base_class; }
            }
        }
    }

    /**
     * removes a node type from the system
     * @method unregisterNodeType
     * @param {String|Object} type name of the node or the node constructor itself
     */
    static unregisterNodeType(type:string|any) {
        const base_class = (typeof type === 'string') ? this.registered_node_types[type] : type;
        if (!base_class) { throw ('node type not found: ' + type); }
        delete this.registered_node_types[base_class.type];
        if (base_class.constructor.name) { delete this.Nodes[base_class.constructor.name]; }
    }

    /**
     * Create a new nodetype by passing a function, it wraps it with a proper class and generates inputs according to the parameters of the function.
     * Useful to wrap simple methods that do not require properties, and that only process some input to generate an output.
     * @method wrapFunctionAsNode
     * @param {String} name node name with namespace (p.e.: 'math/sum')
     * @param {Function} func
     * @param {Array} param_types [optional] an array containing the type of every parameter, otherwise parameters will accept any type
     * @param {String} return_type [optional] string with the return type, otherwise it will be generic
     * @param {Object} properties [optional] properties to be configurable
     */
    static wrapFunctionAsNode(
        name:string,
        func:Function,
        param_types?:any[],
        return_type?:string,
        properties?:Record<string, unknown>
    ) {
        const params = Array(func.length);
        let code = '';
        const names = LiteGraph.getParameterNames(func);
        for (let i = 0; i < names.length; ++i) {
            code +=
                'this.addInput(\'' +
                names[i] +
                '\',' +
                (param_types && param_types[i]
                    ? '\'' + param_types[i] + '\''
                    : '0') +
                ');\n';
        }
        code +=
            'this.addOutput(\'out\',' +
            (return_type ? '\'' + return_type + '\'' : 0) +
            ');\n';
        if (properties) {
            code +=
                'this.properties = ' + JSON.stringify(properties) + ';\n';
        }
        const classobj = Function(code);
        classobj.title = name.split('/').pop();
        classobj.desc = 'Generated from ' + func.name;
        classobj.prototype.onExecute = function onExecute() {
            for (let i = 0; i < params.length; ++i) {
                params[i] = this.getInputData(i);
            }
            const r = func.apply(this, params);
            this.setOutputData(0, r);
        };
        this.registerNodeType(name, classobj);
    }
    static getParameterNames(func: any) {
        return (func + '')
            .replace(/[/][/].*$/gm, '') // strip single-line comments
            .replace(/\s+/g, '') // strip white space
            .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  /**/
            .split('){', 1)[0]
            .replace(/^[^(]*[(]/, '') // extract the parameters
            .replace(/=[^,]+/g, '') // strip any ES6 defaults
            .split(',')
            .filter(Boolean); // split & filter [""]
    }

    /**
     * Removes all previously registered node's types
     */
    static clearRegisteredTypes() {
        this.registered_node_types = {};
        this.node_types_by_file_extension = {};
        this.Nodes = {};
        this.searchbox_extras = {};
    }

    /**
     * Adds this method to all nodetypes, existing and to be created
     * (You can add it to LGraphNode.prototype but then existing node types wont have it)
     * @method addNodeMethod
     * @param {Function} func
     */
    static addNodeMethod(name:string, func:Function) {
        // @ts-ignore
        LGraphNode.prototype[name] = func;
        for (const i in this.registered_node_types) {
            const type = this.registered_node_types[i];
            if (type.prototype[name]) {
                type.prototype['_' + name] = type.prototype[name];
            } // keep old in case of replacing
            type.prototype[name] = func;
        }
    }

    /**
     * Create a node of a given type with a name. The node is not attached to any graph yet.
     * @method createNode
     * @param {String} type full name of the node class. p.e. "math/sin"
     * @param {String} name a name to distinguish from other nodes
     * @param {Object} options to set options
     */

    static createNode(type:string, title?:string, options?:any) {
        const base_class = this.registered_node_types[type];
        if (!base_class) {
            if (LiteGraph.debug) {
                console.log(
                    'GraphNode type "' + type + '" not registered.'
                );
            }
            return null;
        }

        const prototype = base_class.prototype || base_class;

        title = title || base_class.title || type;

        let node = null;

        if (LiteGraph.catch_exceptions) {
            try {
                node = new base_class(title);
            } catch (err) {
                console.error(err);
                return null;
            }
        } else {
            node = new base_class(title);
        }

        node.type = type;

        if (!node.title && title) {
            node.title = title;
        }
        if (!node.properties) {
            node.properties = {};
        }
        if (!node.properties_info) {
            node.properties_info = [];
        }
        if (!node.flags) {
            node.flags = {};
        }
        if (!node.size) {
            node.size = node.computeSize();
            // call onresize?
        }
        if (!node.pos) {
            node.pos = LiteGraph.DEFAULT_POSITION.concat();
        }
        if (!node.mode) {
            node.mode = LiteGraph.ALWAYS;
        }

        // extra options
        if (options) {
            for (const i in options) {
                node[i] = options[i];
            }
        }

        return node;
    }

    /**
     * Returns a registered node type with a given name
     * @method getNodeType
     * @param {String} type full name of the node class. p.e. "math/sin"
     * @return {Class} the node class
     */
    static getNodeType(type:string) {
        return this.registered_node_types[type];
    }

    /**
     * Returns a list of node types matching one category
     * @method getNodeType
     * @param {String} category category name
     * @return {Array} array with all the node classes
     */

    static getNodeTypesInCategory(category:string, filter:string[]) {
        const r = [];
        for (const i in this.registered_node_types) {
            const type = this.registered_node_types[i];
            if (type.filter != filter) {
                continue;
            }

            if (category == '') {
                if (type.category == null) {
                    r.push(type);
                }
            } else if (type.category == category) {
                r.push(type);
            }
        }

        return this.auto_sort_node_types ? r.sort() : r;
    }

    /**
     * Returns a list with all the node type categories
     * @method getNodeTypesCategories
     * @param {String} filter only nodes with ctor.filter equal can be shown
     * @return {Array} array with all the names of the categories
     */
    static getNodeTypesCategories(filter:string) {
        const categories:Record<string, number> = { '': 1 };
        for (const i in this.registered_node_types) {
            const type = this.registered_node_types[i];
            if (type.category && !type.skip_list) {
                if (type.filter != filter) { continue; }
                categories[type.category] = 1;
            }
        }
        const result = [];
        for (const i in categories) {
            result.push(i);
        }
        return this.auto_sort_node_types ? result.sort() : result;
    }

    // debug purposes: reloads all the js scripts that matches a wildcard
    static reloadNodes(folder_wildcard:string) {
        const tmp = document.getElementsByTagName('script');
        // weird, this array changes by its own, so we use a copy
        const script_files = [];
        for (let i = 0; i < tmp.length; i++) {
            script_files.push(tmp[i]);
        }

        const docHeadObj = document.getElementsByTagName('head')[0];
        folder_wildcard = document.location.href + folder_wildcard;

        for (let i = 0; i < script_files.length; i++) {
            const src = script_files[i].src;
            if (
                !src ||
                src.substr(0, folder_wildcard.length) != folder_wildcard
            ) {
                continue;
            }

            try {
                if (LiteGraph.debug) {
                    console.log('Reloading: ' + src);
                }
                const dynamicScript = document.createElement('script');
                dynamicScript.type = 'text/javascript';
                dynamicScript.src = src;
                docHeadObj.appendChild(dynamicScript);
                docHeadObj.removeChild(script_files[i]);
            } catch (err) {
                if (LiteGraph.throw_errors) {
                    throw err;
                }
                if (LiteGraph.debug) {
                    console.log('Error while reloading ' + src);
                }
            }
        }

        if (LiteGraph.debug) {
            console.log('Nodes reloaded');
        }
    }

    // separated just to improve if it doesn't work
    static cloneObject(obj?:any, target?:any) {
        if (obj == null) {
            return null;
        }
        const r = JSON.parse(JSON.stringify(obj));
        if (!target) {
            return r;
        }

        for (const i in r) {
            target[i] = r[i];
        }
        return target;
    }

    /**
     * Returns if the types of two slots are compatible (taking into account wildcards, etc)
     * @method isValidConnection
     * @param {String} type_a
     * @param {String} type_b
     * @return {Boolean} true if they can be connected
     */
    static isValidConnection(type_a:string, type_b:string) {
        if (
            !type_a || // generic output
            !type_b || // generic input
            type_a == type_b || // same type (is valid for triggers)
            (type_a == LiteGraph.EVENT.toString() && type_b == LiteGraph.ACTION.toString())
        ) {
            return true;
        }

        // Enforce string type to handle toLowerCase call (-1 number not ok)
        type_a = String(type_a);
        type_b = String(type_b);
        type_a = type_a.toLowerCase();
        type_b = type_b.toLowerCase();

        // For nodes supporting multiple connection types
        if (type_a.indexOf(',') == -1 && type_b.indexOf(',') == -1) {
            return type_a == type_b;
        }

        // Check all permutations to see if one is valid
        const supported_types_a = type_a.split(',');
        const supported_types_b = type_b.split(',');
        for (let i = 0; i < supported_types_a.length; ++i) {
            for (let j = 0; j < supported_types_b.length; ++j) {
                if (supported_types_a[i] == supported_types_b[j]) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Register a string in the search box so when the user types it it will recommend this node
     * @method registerSearchboxExtra
     * @param {String} node_type the node recommended
     * @param {String} description text to show next to it
     * @param {Object} data it could contain info of how the node should be configured
     * @return {Boolean} true if they can be connected
     */
    static registerSearchboxExtra(node_type:string, description:string, data:Object) {
        this.searchbox_extras[description.toLowerCase()] = {
            type: node_type,
            desc: description,
            data: data,
        };
    }

    /**
     * Wrapper to load files (from url using fetch or from file using FileReader)
     * @method fetchFile
     * @param {String|File|Blob} url the url of the file (or the file itself)
     * @param {String} type an string to know how to fetch it: "text","arraybuffer","json","blob"
     * @param {Function} on_complete callback(data)
     * @param {Function} on_error in case of an error
     * @return {FileReader|Promise} returns the object used to 
     */
    static fetchFile(url:string|File|Blob, type:string, on_complete:Function, on_error:Function) {
        const that = this;
        if (!url) { return null; }

        type = type || 'text';
        if (url.constructor === String) {
            if (url.substr(0, 4) == 'http' && LiteGraph.proxy) {
                url = LiteGraph.proxy + url.substr(url.indexOf(':') + 3);
            }
            return fetch(url)
                .then(function(response) {
                    if (!response.ok) { throw new Error('File not found'); } // it will be catch below
                    if (type == 'arraybuffer') { return response.arrayBuffer(); }
                    else if (type == 'text' || type == 'string') { return response.text(); }
                    else if (type == 'json') { return response.json(); }
                    else if (type == 'blob') { return response.blob(); }
                })
                .then(function(data) {
                    if (on_complete) { on_complete(data); }
                })
                .catch(function(error) {
                    console.error('error fetching file:', url);
                    if (on_error) { on_error(error); }
                });
        }
        else if (url.constructor === File || url.constructor === Blob) {
            const reader = new FileReader();
            reader.onload = function(e) {
                let v = e.target?.result;
                if(v){
                    if (type == 'json') { v = JSON.parse(v.toString()); }
                    if (on_complete) { on_complete(v); }
                }
            };
            if (type == 'arraybuffer') { return reader.readAsArrayBuffer(url); }
            else if (type == 'text' || type == 'json') { return reader.readAsText(url); }
            else if (type == 'blob') { return reader.readAsBinaryString(url); }
        }
        return null;
    }

    /**
     * timer that works everywhere
     */
    static getTime() {
        if (typeof performance !== 'undefined') {
            return performance.now();
        } else if (typeof Date !== 'undefined' && Date.now) {
            return Date.now();
        } else if (typeof process !== 'undefined') {
            const t = process.hrtime();
            return t[0] * 0.001 + t[1] * 1e-6;
        } else {
            return new Date().getTime();
        }
    }
}
export type serializedLGraph<
    TNode = ReturnType<LGraphNode['serialize']>,
    // https://github.com/jagenjo/litegraph.js/issues/74
    TLink = [number, number, number, number, number, string],
    TGroup = ReturnType<LGraphGroup['serialize']>
> = {
    last_node_id: ILGraph['last_node_id'];
    last_link_id: ILGraph['last_link_id'];
    nodes: TNode[];
    links: TLink[];
    groups: TGroup[];
    config: ILGraph['config'];
    version: typeof LiteGraph.VERSION;
    extra: LGraph['extra']
};
export type LGraphNodeConstructor<T extends LGraphNode = LGraphNode> = {
    new (): T;
};

/* LiteGraph GUI elements used for canvas editing *************************************/
interface IContextMenu {
    static trigger(
        element: HTMLElement,
        event_name: string,
        params: any,
        origin: any
    ): void;
    static isCursorOverElement(event: MouseEvent, element: HTMLElement): void;
    static closeAllContextMenus(window: Window): void;
    options: IContextMenuOptions;
    parentMenu?: ContextMenu;
    lock: boolean;
    current_submenu?: ContextMenu;
    addItem(
        name: string,
        value: ContextMenuItem,
        options?: IContextMenuOptions
    ): void;
    close(e?: MouseEvent, ignore_parent_menu?: boolean): void;
    getTopMenu(): void;
    getFirstEvent(): void;
}


/**
     * ContextMenu from LiteGUI
     *
     * @class ContextMenu
     * @constructor
     * @param {Array} values (allows object { title: "Nice text", callback: function ... })
     * @param {Object} options [optional] Some options:\
     * - title: title to show on top of the menu
     * - callback: function to call when an option is clicked, it receives the item information
     * - ignore_item_callbacks: ignores the callback inside the item, it just calls the options.callback
     * - event: you can pass a MouseEvent, this way the ContextMenu appears in that position
     */
class ContextMenu implements IContextMenu {
    options: any;
    parentMenu: any;
    root: HTMLDivElement;
    lock: any;
    current_submenu: any;
    constructor(values: ContextMenuItem[], options?:IContextMenuOptions){
     
        options = options || {};
        this.options = options;
        const that = this;

        // to link a menu with its parent
        if (options.parentMenu) {
        if (options.parentMenu.constructor !== this.constructor) {
            console.error(
                    'parentMenu must be of class ContextMenu, ignoring it'
            );
            options.parentMenu = null;
        } else {
            this.parentMenu = options.parentMenu;
            this.parentMenu.lock = true;
            this.parentMenu.current_submenu = this;
        }
        }

        let eventClass = null;
        if (options.event) // use strings because comparing classes between windows doesnt work
        { eventClass = options.event.constructor.name; }
        if (eventClass !== 'MouseEvent' &&
            eventClass !== 'CustomEvent' &&
			eventClass !== 'PointerEvent'
    ) {
        console.error(
                'Event passed to ContextMenu is not of type MouseEvent or CustomEvent. Ignoring it.'
        );
        options.event = null;
    }

    const root = document.createElement('div');
    root.className = 'litegraph litecontextmenu litemenubar-panel';
    if (options.className) {
        root.className += ' ' + options.className;
    }
    root.style.minWidth = '100';
    root.style.minHeight = '100';
    root.style.pointerEvents = 'none';
    setTimeout(function() {
        root.style.pointerEvents = 'auto';
    }, 100); // delay so the mouse up event is not caught by this element

    // this prevents the default context browser menu to open in case this menu was created when pressing right button
    root.addEventListener(
            'mouseup',
            function(e) {
                e.preventDefault();
                return true;
            },
            true
    );
    root.addEventListener(
            'contextmenu',
            function(e) {
                if (e.button != 2) {
                    // right button
                    return false;
                }
                e.preventDefault();
                return false;
            },
            true
    );

    root.addEventListener(
            'mousedown',
            function(e) {
                if (e.button == 2) {
                    that.close();
                    e.preventDefault();
                    return true;
                }
            },
            true
    );

    function on_mouse_wheel(e: WheelEvent) {
        const pos = parseInt(root.style.top);
        root.style.top =
                (pos + e.deltaY * (options?.scroll_speed as number)).toFixed() + 'px';
        e.preventDefault();
        return true;
    }

    if (!options.scroll_speed) {
        options.scroll_speed = 0.1;
    }

    root.addEventListener('wheel', on_mouse_wheel, true);
    //@ts-ignore
    root.addEventListener('mousewheel', on_mouse_wheel, true);

    this.root = root;

    // title
    if (options.title) {
        const element = document.createElement('div');
        element.className = 'litemenu-title';
        (element.innerHTML as unknown as string) = options.title;
        root.appendChild(element);
    }

    // entries
    let num = 0;
    for (let i = 0; i < values.length; i++) {
        let name = values.constructor == Array ? values[i] : i;
        if (name != null && name.constructor !== String) {
            name = name.content === undefined ? String(name) : name.content;
        }
        const value = values[i];
        this.addItem(name, value, options);
        num++;
    }

    // close on leave
    root.addEventListener('mouseleave', function(e) {
        if (that.lock) {
            return;
        }
        if (root.closing_timer) {
            clearTimeout(root.closing_timer);
        }
        root.closing_timer = setTimeout(that.close.bind(that, e), 500);
        // that.close(e);
    });

    root.addEventListener('mouseenter', function(e) {
        if (root.closing_timer) {
            clearTimeout(root.closing_timer);
        }
    });

    // insert before checking position
    let root_document = document;
    if (options.event) {
        root_document = options.event.target.ownerDocument;
    }

    if (!root_document) {
        root_document = document;
    }

    if (root_document.fullscreenElement)
	        { root_document.fullscreenElement.appendChild(root); }
    else
		    { root_document.body.appendChild(root); }

    // compute best position
    let left = options.left || 0;
    let top = options.top || 0;
    if (options.event) {
        left = options.event.clientX - 10;
        top = options.event.clientY - 10;
        if (options.title) {
            top -= 20;
        }

        if (options.parentMenu) {
            const rect = options.parentMenu.root.getBoundingClientRect();
            left = rect.left + rect.width;
        }

        const body_rect = document.body.getBoundingClientRect();
        const root_rect = root.getBoundingClientRect();
        if (body_rect.height == 0)
        { console.error('document.body height is 0. That is dangerous, set html,body { height: 100%; }'); }

        if (body_rect.width && left > body_rect.width - root_rect.width - 10) {
            left = body_rect.width - root_rect.width - 10;
        }
        if (body_rect.height && top > body_rect.height - root_rect.height - 10) {
            top = body_rect.height - root_rect.height - 10;
        }
    }

    root.style.left = left + 'px';
    root.style.top = top + 'px';

    if (options.scale) {
        root.style.transform = 'scale(' + options.scale + ')';
    }
}  
    trigger(element: HTMLElement, event_name: string, params: any, origin: any): void {
        throw new Error("Method not implemented.");
    }
    isCursorOverElement(event: MouseEvent, element: HTMLElement): void {
        throw new Error("Method not implemented.");
    }
    closeAllContextMenus(window: Window): void {
        throw new Error("Method not implemented.");
    }
    addItem(name: string, value: ContextMenuItem, options: { autoopen?: any; callback?: any; node?: any; ignore_item_callbacks?: any; extra?: any; }) {
    const that = this;
    options = options || {};

    const element = document.createElement('div');
    element.className = 'litemenu-entry submenu';

    let disabled = false;

    if (value === null) {
        element.classList.add('separator');
        // element.innerHTML = "<hr/>"
        // continue;
    } else {
        (element.innerHTML as unknown as string) = value && value.title ? value.title : name;
        element.value = value;

        if (value) {
            if (value.disabled) {
                disabled = true;
                element.classList.add('disabled');
            }
            if (value.submenu || value.has_submenu) {
                element.classList.add('has_submenu');
            }
        }

        if (typeof value === 'function') {
            element.dataset['value'] = name;
            element.onclick_callback = value;
        } else {
            // @ts-ignore
            element.dataset['value'] = value;
        }

        if (value.className) {
            element.className += ' ' + value.className;
        }
    }

    this.root.appendChild(element);
    if (!disabled) {
        element.addEventListener('click', inner_onclick);
    }
    if (options.autoopen) {
        element.addEventListener('mouseenter', inner_over);
    }

    function inner_over(this: HTMLElement&{value:any},e: any) {
        const value = this.value;
        if (!value || !value.has_submenu) {
            return;
        }
        // if it is a submenu, autoopen like the item was clicked
        inner_onclick.call(this, e);
    }

    // menu option clicked
    function inner_onclick(this: HTMLElement&{value:any},e: any) {
        const value = this.value;
        let close_parent = true;

        if (that.current_submenu) {
            that.current_submenu.close(e);
        }

        // global callback
        if (options.callback) {
            var r = options.callback.call(
                    this,
                    value,
                    options,
                    e,
                    that,
                    options.node
            );
            if (r === true) {
                close_parent = false;
            }
        }

        // special cases
        if (value) {
            if (
                value.callback &&
                    !options.ignore_item_callbacks &&
                    value.disabled !== true
            ) {
                // item callback
                var r = value.callback.call(
                        this,
                        value,
                        options,
                        e,
                        that,
                        options.extra
                );
                if (r === true) {
                    close_parent = false;
                }
            }
            if (value.submenu) {
                if (!value.submenu.options) {
                    throw 'ContextMenu submenu needs options';
                }
                const submenu = new that.constructor(value.submenu.options, {
                    callback: value.submenu.callback,
                    event: e,
                    parentMenu: that,
                    ignore_item_callbacks:
                            value.submenu.ignore_item_callbacks,
                    title: value.submenu.title,
                    extra: value.submenu.extra,
                    autoopen: options.autoopen,
                });
                close_parent = false;
            }
        }

        if (close_parent && !that.lock) {
            that.close();
        }
    }

    return element;
};

close(e?: MouseEvent, ignore_parent_menu?: undefined) {
    if (this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
    }
    if (this.parentMenu && !ignore_parent_menu) {
        this.parentMenu.lock = false;
        this.parentMenu.current_submenu = null;
        if (e === undefined) {
            this.parentMenu.close();
        } else if (
            e &&
                !ContextMenu.isCursorOverElement(e, this.parentMenu.root)
        ) {
            ContextMenu.trigger(this.parentMenu.root, 'mouseleave', e);
        }
    }
    if (this.current_submenu) {
        this.current_submenu.close(e, true);
    }

    if (this.root.closing_timer) {
        clearTimeout(this.root.closing_timer);
    }
};
// returns the top most menu
getTopMenu() {
    if (this.options.parentMenu) {
        return this.options.parentMenu.getTopMenu();
    }
    return this;
};

getFirstEvent() {
    if (this.options.parentMenu) {
        return this.options.parentMenu.getFirstEvent();
    }
    return this.options.event;
};

// this code is used to trigger events easily (used in the context menu mouseleave
static trigger = function(element:HTMLElement, event_name: string, params: any, origin: any) {
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event_name, true, true, params); // canBubble, cancelable, detail
    evt.srcElement = origin;
    if (element.dispatchEvent) {
        element.dispatchEvent(evt);
    } else if (element.__events) {
        element.__events.dispatchEvent(evt);
    }
    // else nothing seems binded here so nothing to do
    return evt;
};



static isCursorOverElement = function(event: MouseEvent, element: { getBoundingClientRect: () => any; }) {
    const left = event.clientX;
    const top = event.clientY;
    const rect = element.getBoundingClientRect();
    if (!rect) {
        return false;
    }
    if (
        top > rect.top &&
            top < rect.top + rect.height &&
            left > rect.left &&
            left < rect.left + rect.width
    ) {
        return true;
    }
    return false;
};
}  






export interface ILGraph {
    supported_types?:string[];

    catch_errors: boolean;
    /** custom data */
    config: object;
    elapsed_time: number;
    fixedtime: number;
    fixedtime_lapse: number;
    globaltime: number;
    inputs: any;
    iteration: number;
    last_link_id: number;
    last_node_id: number;
    last_update_time: number;
    links: Record<number, LLink>;
    list_of_graphcanvas: LGraphCanvas[]|null;
    outputs: any;
    runningtime: number;
    starttime: number;
    status: typeof LGraph.STATUS_RUNNING | typeof LGraph.STATUS_STOPPED;

    private _nodes: LGraphNode[];
    private _groups: LGraphGroup[];
    private _nodes_by_id: Record<number, LGraphNode>;
    /** nodes that are executable sorted in execution order */
    private _nodes_executable:
        | (LGraphNode[] & { onExecute: NonNullable<LGraphNode['onExecute']> }[])
        | null;
    /** nodes that contain onExecute */
    private _nodes_in_order: LGraphNode[];
    private _version: number;

    getSupportedTypes(): string[];
    /** Removes all nodes from this graph */
    clear(): void;
    /** Attach Canvas to this graph */
    attachCanvas(graphCanvas: LGraphCanvas): void;
    /** Detach Canvas to this graph */
    detachCanvas(graphCanvas: LGraphCanvas): void;
    /**
     * Starts running this graph every interval milliseconds.
     * @param interval amount of milliseconds between executions, if 0 then it renders to the monitor refresh rate
     */
    start(interval?: number): void;
    /** Stops the execution loop of the graph */
    stop(): void;
    /**
     * Run N steps (cycles) of the graph
     * @param num number of steps to run, default is 1
     */
    runStep(num?: number, do_not_catch_errors?: boolean): void;
    /**
     * Updates the graph execution order according to relevance of the nodes (nodes with only outputs have more relevance than
     * nodes with only inputs.
     */
    updateExecutionOrder(): void;
    /** This is more internal, it computes the executable nodes in order and returns it */
    computeExecutionOrder(only_onExecute?: boolean, set_level?: boolean): LGraphNode[];
    /**
     * Returns all the nodes that could affect this one (ancestors) by crawling all the inputs recursively.
     * It doesn't include the node itself
     * @return an array with all the LGraphNodes that affect this node, in order of execution
     */
    getAncestors(node: LGraphNode): LGraphNode[];
    /**
     * Positions every node in a more readable manner
     */
    arrange(margin?: number): void;
    /**
     * Returns the amount of time the graph has been running in milliseconds
     * @return number of milliseconds the graph has been running
     */
    getTime(): number;

    /**
     * Returns the amount of time accumulated using the fixedtime_lapse var. This is used in context where the time increments should be constant
     * @return number of milliseconds the graph has been running
     */
    getFixedTime(): number;

    /**
     * Returns the amount of time it took to compute the latest iteration. Take into account that this number could be not correct
     * if the nodes are using graphical actions
     * @return number of milliseconds it took the last cycle
     */
    getElapsedTime(): number;
    /**
     * Sends an event to all the nodes, useful to trigger stuff
     * @param eventName the name of the event (function to be called)
     * @param params parameters in array format
     */
    sendEventToAllNodes(eventName: string, params: any[], mode?: any): void;

    sendActionToCanvas(action: any, params: any[]): void;
    /**
     * Adds a new node instance to this graph
     * @param node the instance of the node
     */
    add(node: LGraphNode, skip_compute_order?: boolean): void;
    /**
     * Called when a new node is added
     * @param node the instance of the node
     */
    onNodeAdded(node: LGraphNode): void;
    /** Removes a node from the graph */
    remove(node: LGraphNode): void;
    /** Returns a node by its id. */
    getNodeById(id: number): LGraphNode | null;
    /**
     * Returns a list of nodes that matches a class
     * @param classObject the class itself (not an string)
     * @return a list with all the nodes of this type
     */
    findNodesByClass<T extends LGraphNode>(
        classObject: LGraphNodeConstructor<T>,
        result:T[]
    ): T[];
    /**
     * Returns a list of nodes that matches a type
     * @param type the name of the node type
     * @return a list with all the nodes of this type
     */
    findNodesByType<T extends LGraphNode = LGraphNode>(type: string,result:T[]): T[];
    /**
     * Returns the first node that matches a name in its title
     * @param title the name of the node to search
     * @return the node or null
     */
    findNodeByTitle<T extends LGraphNode = LGraphNode>(title: string): T | null;
    /**
     * Returns a list of nodes that matches a name
     * @param title the name of the node to search
     * @return a list with all the nodes with this name
     */
    findNodesByTitle<T extends LGraphNode = LGraphNode>(title: string): T[];
    /**
     * Returns the top-most node in this position of the canvas
     * @param x the x coordinate in canvas space
     * @param y the y coordinate in canvas space
     * @param nodes_list a list with all the nodes to search from, by default is all the nodes in the graph
     * @return the node at this position or null
     */
    getNodeOnPos<T extends LGraphNode = LGraphNode>(
        x: number,
        y: number,
        node_list?: LGraphNode[],
        margin?: number
    ): T | null;
    /**
     * Returns the top-most group in that position
     * @param x the x coordinate in canvas space
     * @param y the y coordinate in canvas space
     * @return the group or null
     */
    getGroupOnPos(x: number, y: number): LGraphGroup | null;

    onAction(action: any, param: any): void;
    trigger(action: any, param: any): void;
    /** Tell this graph it has a global graph input of this type */
    addInput(name: string, type: string, value?: any): void;
    /** Assign a data to the global graph input */
    setInputData(name: string, data: any): void;
    /** Returns the current value of a global graph input */
    getInputData<T = any>(name: string): T;
    /** Changes the name of a global graph input */
    renameInput(old_name: string, name: string): false | undefined;
    /** Changes the type of a global graph input */
    changeInputType(name: string, type: string): false | undefined;
    /** Removes a global graph input */
    removeInput(name: string): boolean;
    /** Creates a global graph output */
    addOutput(name: string, type: string, value: any): void;
    /** Assign a data to the global output */
    setOutputData(name: string, value: string): void;
    /** Returns the current value of a global graph output */
    getOutputData<T = any>(name: string): T;

    /** Renames a global graph output */
    renameOutput(old_name: string, name: string): false | undefined;
    /** Changes the type of a global graph output */
    changeOutputType(name: string, type: string): false | undefined;
    /** Removes a global graph output */
    removeOutput(name: string): boolean;
    triggerInput(name: string, value: any): void;
    setCallback(name: string, func: (...args: any[]) => any): void;
    connectionChange(node: LGraphNode): void;
    /** returns if the graph is in live mode */
    isLive(): boolean;
    /** clears the triggered slot animation in all links (stop visual animation) */
    clearTriggeredSlots(): void;
    /* Called when something visually changed (not the graph!) */
    change(): void;
    setDirtyCanvas(fg: boolean, bg: boolean): void;
    /** Destroys a link */
    removeLink(link_id: number): void;
    /** Creates a Object containing all the info about this graph, it can be serialized */
    //serialize();
    /**
     * Configure a graph from a JSON string
     * @param data configure a graph from a JSON string
     * @returns if there was any error parsing
     */
    configure(data: object, keep_old?: boolean): boolean | undefined;
    load(url: string): void;
}



class LGraph implements ILGraph {
    catch_errors!: boolean;
    /** custom data */
    config!: {align_to_grid?:boolean};
    elapsed_time!: number;
    fixedtime!: number;
    fixedtime_lapse!: number;
    globaltime!: number;
    inputs: any;
    iteration!: number;
    last_link_id!: number;
    last_node_id!: number;
    last_update_time!: number;
    links!: Record<number, LLink>;
    list_of_graphcanvas: LGraphCanvas[]|null;
    outputs: any;
    runningtime!: number;
    starttime!: number;
    status!: typeof LGraph.STATUS_RUNNING | typeof LGraph.STATUS_STOPPED;
    _nodes!: LGraphNode[];
    private _groups!: LGraphGroup[];
    private _nodes_by_id!: Record<number|string, LGraphNode>;
    /** nodes that are executable sorted in execution order */
    private _nodes_executable!:
    (LGraphNode[] & { onExecute: NonNullable<LGraphNode["onExecute"]> }[])
    | null;
    /** nodes that contain onExecute */
    private _nodes_in_order!: LGraphNode[];
    _version!: number;

    vars!: {}
    extra!: {}
    onPlayEvent: any
    execution_timer_id!:number|null
    onBeforeStep: any
    onAfterStep: any
    onStopEvent: any
    onExecuteStep: any
    onAfterExecute: any
    errors_in_execution = false
    execution_time!: number
    onNodeAdded: any
    onNodeRemoved: any
    _input_nodes: any
    onTrigger: any
    onInputAdded: any
    onInputsOutputsChange: any
    onInputRenamed: any
    onInputTypeChanged: any
    onInputRemoved: any
    onOutputAdded: any
    onOutputRenamed: any
    onOutputTypeChanged: any
    onOutputRemoved: any
    onBeforeChange: any
    onAfterChange: any
    onConnectionChange: any
    on_change: any
    onSerialize: any
    onConfigure: any
    _last_trigger_time?: number;
    
    onNodeConnectionChange?:(inout:number,targetNode:LGraphNode,targetSlot:number|string,node:LGraphNode,slot:number|string)=>void;
    constructor(o?:any) {
        if (LiteGraph.debug) {
            console.log('Graph created');
        }
        this.list_of_graphcanvas = null;
        this.clear();

        if (o) {
            this.configure(o);
        }

    }

    static STATUS_STOPPED = 1;
    static STATUS_RUNNING = 2;
    // default supported types
    static supported_types = ['number', 'string', 'boolean'];
    supported_types?:string[]

    // used to know which types of connections support this graph (some graphs do not allow certain types)
    getSupportedTypes() {
        return this.supported_types || LGraph.supported_types;
    }

    /**
     * Removes all nodes from this graph
     * @method clear
     */

    clear() {
        this.stop();
        this.status = LGraph.STATUS_STOPPED;

        this.last_node_id = 0;
        this.last_link_id = 0;

        this._version = -1; // used to detect changes

        // safe clear
        if (this._nodes) {
            for (let i = 0; i < this._nodes.length; ++i) {
                const node = this._nodes[i];
                if (node.onRemoved) {
                    node.onRemoved();
                }
            }
        }

        // nodes
        this._nodes = [];
        this._nodes_by_id = {};
        this._nodes_in_order = []; // nodes sorted in execution order
        this._nodes_executable = null; // nodes that contain onExecute sorted in execution order

        // other scene stuff
        this._groups = [];

        // links
        this.links = {}; // container with all the links

        // iterations
        this.iteration = 0;

        // custom data
        this.config = {};
        this.vars = {};
        this.extra = {}; // to store custom data

        // timing
        this.globaltime = 0;
        this.runningtime = 0;
        this.fixedtime = 0;
        this.fixedtime_lapse = 0.01;
        this.elapsed_time = 0.01;
        this.last_update_time = 0;
        this.starttime = 0;

        this.catch_errors = true;

        // subgraph_data
        this.inputs = {};
        this.outputs = {};

        // notify canvas to redraw
        this.change();

        this.sendActionToCanvas('clear');
    }

    /**
     * Attach Canvas to this graph
     * @method attachCanvas
     * @param {GraphCanvas} graph_canvas
     */

    attachCanvas(graphcanvas:LGraphCanvas) {
        if (graphcanvas.constructor != LGraphCanvas) {
            throw 'attachCanvas expects a LGraphCanvas instance';
        }
        if (graphcanvas.graph && graphcanvas.graph != this) {
            graphcanvas.graph.detachCanvas(graphcanvas);
        }

        graphcanvas.graph = this;

        if (!this.list_of_graphcanvas) {
            this.list_of_graphcanvas = [];
        }
        this.list_of_graphcanvas.push(graphcanvas);
    }

    /**
     * Detach Canvas from this graph
     * @method detachCanvas
     * @param {GraphCanvas} graph_canvas
     */
    detachCanvas(graphcanvas:LGraphCanvas) {
        if (!this.list_of_graphcanvas) {
            return;
        }

        const pos = this.list_of_graphcanvas.indexOf(graphcanvas);
        if (pos == -1) {
            return;
        }
        graphcanvas.graph = null;
        this.list_of_graphcanvas.splice(pos, 1);
    }

    /**
     * Starts running this graph every interval milliseconds.
     * @method start
     * @param {number} interval amount of milliseconds between executions, if 0 then it renders to the monitor refresh rate
     */

    start(interval:number) {
        if (this.status === LGraph.STATUS_RUNNING) {
            return;
        }
        this.status = LGraph.STATUS_RUNNING;

        if (this.onPlayEvent) {
            this.onPlayEvent();
        }

        this.sendEventToAllNodes('onStart');

        // launch
        this.starttime = LiteGraph.getTime();
        this.last_update_time = this.starttime;
        interval = interval || 0;
        const that = this;

        // execute once per frame
        if (interval == 0 && typeof window !== 'undefined' && window.requestAnimationFrame) {
            function on_frame() {
                if (that.execution_timer_id != -1) {
                    return;
                }
                window.requestAnimationFrame(on_frame);
                if (that.onBeforeStep)
                { that.onBeforeStep(); }
                that.runStep(1, !that.catch_errors);
                if (that.onAfterStep)
                { that.onAfterStep(); }
            }
            this.execution_timer_id = -1;
            on_frame();
        } else { // execute every 'interval' ms
            this.execution_timer_id = (setInterval(function () {
                // execute
                if (that.onBeforeStep) { that.onBeforeStep(); }
                that.runStep(1, !that.catch_errors);
                if (that.onAfterStep) { that.onAfterStep(); }
            }, interval) as unknown as number);
        }
    }

    /**
     * Stops the execution loop of the graph
     * @method stop execution
     */

    stop() {
        if (this.status == LGraph.STATUS_STOPPED) {
            return;
        }

        this.status = LGraph.STATUS_STOPPED;

        if (this.onStopEvent) {
            this.onStopEvent();
        }

        if (this.execution_timer_id != null) {
            if (this.execution_timer_id != -1) {
                clearInterval(this.execution_timer_id);
            }
            this.execution_timer_id = null;
        }

        this.sendEventToAllNodes('onStop');
    }

    /**
     * Run N steps (cycles) of the graph
     * @method runStep
     * @param {number} num number of steps to run, default is 1
     * @param {Boolean} do_not_catch_errors [optional] if you want to try/catch errors 
     * @param {number} limit max number of nodes to execute (used to execute from start to a node)
     */

    runStep(num?:number, do_not_catch_errors?:boolean, limit?:number) {
        num = num || 1;

        const start = LiteGraph.getTime();
        this.globaltime = 0.001 * (start - this.starttime);
        const nodes = this._nodes_executable
            ? this._nodes_executable
            : this._nodes;
        if (!nodes) {
            return;
        }

        const _limit = limit || nodes.length;

        if (do_not_catch_errors) {
            // iterations
            for (let i = 0; i < num; i++) {
                for (let j = 0; j < _limit; ++j) {
                    const node = nodes[j];
                    if (node.mode == LiteGraph.ALWAYS && node.onExecute) {
                        node.onExecute(); // hard to send elapsed time
                    }
                }

                this.fixedtime += this.fixedtime_lapse;
                if (this.onExecuteStep) {
                    this.onExecuteStep();
                }
            }

            if (this.onAfterExecute) {
                this.onAfterExecute();
            }
        } else {
            try {
                // iterations
                for (let i = 0; i < num; i++) {
                    for (let j = 0; j < _limit; ++j) {
                        const node = nodes[j];
                        if (node.mode == LiteGraph.ALWAYS && node.onExecute) {
                            node.onExecute();
                        }
                    }

                    this.fixedtime += this.fixedtime_lapse;
                    if (this.onExecuteStep) {
                        this.onExecuteStep();
                    }
                }

                if (this.onAfterExecute) {
                    this.onAfterExecute();
                }
                this.errors_in_execution = false;
            } catch (err) {
                this.errors_in_execution = true;
                if (LiteGraph.throw_errors) {
                    throw err;
                }
                if (LiteGraph.debug) {
                    console.log('Error during execution: ' + err);
                }
                this.stop();
            }
        }

        const now = LiteGraph.getTime();
        let elapsed = now - start;
        if (elapsed == 0) {
            elapsed = 1;
        }
        this.execution_time = 0.001 * elapsed;
        this.globaltime += 0.001 * elapsed;
        this.iteration += 1;
        this.elapsed_time = (now - this.last_update_time) * 0.001;
        this.last_update_time = now;
    }

    /**
     * Updates the graph execution order according to relevance of the nodes (nodes with only outputs have more relevance than
     * nodes with only inputs.
     * @method updateExecutionOrder
     */
    updateExecutionOrder() {
        this._nodes_in_order = this.computeExecutionOrder(false);
        this._nodes_executable = [];
        for (let i = 0; i < this._nodes_in_order.length; ++i) {
            if (this._nodes_in_order[i].onExecute) {
                this._nodes_executable.push(this._nodes_in_order[i]);
            }
        }
    }

    // This is more internal, it computes the executable nodes in order and returns it
    computeExecutionOrder(
        only_onExecute?:boolean,
        set_level?:boolean
    ):LGraphNode[] {
        let L = [];
        const S = [];
        const M:any = {};
        const visited_links:any = {}; // to avoid repeating links
        const remaining_links:any = {}; // to a

        // search for the nodes without inputs (starting nodes)
        for (let i = 0, l = this._nodes.length; i < l; ++i) {
            const node = this._nodes[i];
            if (only_onExecute && !node.onExecute) {
                continue;
            }

            M[node.id] = node; // add to pending nodes

            let num = 0; // num of input connections
            if (node.inputs) {
                for (let j = 0, l2 = node.inputs.length; j < l2; j++) {
                    if (node.inputs[j] && node.inputs[j].link != null) {
                        num += 1;
                    }
                }
            }

            if (num == 0) {
                // is a starting node
                S.push(node);
                if (set_level) {
                    node._level = 1;
                }
            } // num of input links
            else {
                if (set_level) {
                    node._level = 0;
                }
                remaining_links[node.id] = num;
            }
        }

        while (true) {
            if (S.length == 0) {
                break;
            }

            // get an starting node
            const node= S.shift() as LGraphNode ;
            L.push(node); // add to ordered list
            delete M[node.id]; // remove from the pending nodes

            if (!node.outputs) {
                continue;
            }

            // for every output
            for (let i = 0; i < node.outputs.length; i++) {
                const output = node.outputs[i];
                // not connected
                if (
                    output == null ||
                    output.links == null ||
                    output.links.length == 0
                ) {
                    continue;
                }

                // for every connection
                for (let j = 0; j < output.links.length; j++) {
                    const link_id = output.links[j];
                    const link = this.links[link_id];
                    if (!link) {
                        continue;
                    }

                    // already visited link (ignore it)
                    if (visited_links[link.id]) {
                        continue;
                    }

                    const target_node = this.getNodeById(link.target_id);
                    if (target_node == null) {
                        visited_links[link.id] = true;
                        continue;
                    }

                    if (
                        set_level &&
                        (!target_node._level ||
                            target_node._level <= (node._level as number))
                    ) {
                        target_node._level = (node._level as number) + 1;
                    }

                    visited_links[link.id] = true; // mark as visited
                    remaining_links[target_node.id] -= 1; // reduce the number of links remaining
                    if (remaining_links[target_node.id] == 0) {
                        S.push(target_node);
                    } // if no more links, then add to starters array
                }
            }
        }

        // the remaining ones (loops)
        for (const i in M) {
            L.push(M[i]);
        }

        if (L.length != this._nodes.length && LiteGraph.debug) {
            console.warn('something went wrong, nodes missing');
        }

        const l = L.length;

        // save order number in the node
        for (let i = 0; i < l; ++i) {
            L[i].order = i;
        }

        // sort now by priority
        L = L.sort(function(A, B) {
            const Ap = A.constructor.priority || A.priority || 0;
            const Bp = B.constructor.priority || B.priority || 0;
            if (Ap == Bp) {
                // if same priority, sort by order
                return A.order - B.order;
            }
            return Ap - Bp; // sort by priority
        });

        // save order number in the node, again...
        for (let i = 0; i < l; ++i) {
            L[i].order = i;
        }

        return L;
    }

    /**
     * Returns all the nodes that could affect this one (ancestors) by crawling all the inputs recursively.
     * It doesn't include the node itself
     * @method getAncestors
     * @return {Array} an array with all the LGraphNodes that affect this node, in order of execution
     */
    getAncestors(node: any) {
        const ancestors = [];
        const pending = [node];
        const visited:any = {};

        while (pending.length) {
            const current = pending.shift();
            if (!current.inputs) {
                continue;
            }
            if (!visited[current.id] && current != node) {
                visited[current.id] = true;
                ancestors.push(current);
            }

            for (let i = 0; i < current.inputs.length; ++i) {
                const input = current.getInputNode(i);
                if (input && ancestors.indexOf(input) == -1) {
                    pending.push(input);
                }
            }
        }

        ancestors.sort(function(a, b) {
            return a.order - b.order;
        });
        return ancestors;
    }

    /**
     * Positions every node in a more readable manner
     * @method arrange
     */
    arrange(margin: number) {
        margin = margin || 100;

        const nodes = this.computeExecutionOrder(false, true);
        const columns:LGraphNode[][] = [];
        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            const col = node._level || 1;
            if (!columns[col]) {
                columns[col] = [];
            }
            columns[col].push(node);
        }

        let x = margin;

        for (let i = 0; i < columns.length; ++i) {
            const column = columns[i];
            if (!column) {
                continue;
            }
            let max_size = 100;
            let y = margin + LiteGraph.NODE_TITLE_HEIGHT;
            for (let j = 0; j < column.length; ++j) {
                const node = column[j];
                node.pos[0] = x;
                node.pos[1] = y;
                if (node.size[0] > max_size) {
                    max_size = node.size[0];
                }
                y += node.size[1] + margin + LiteGraph.NODE_TITLE_HEIGHT;
            }
            x += max_size + margin;
        }

        this.setDirtyCanvas(true, true);
    }

    /**
     * Returns the amount of time the graph has been running in milliseconds
     * @method getTime
     * @return {number} number of milliseconds the graph has been running
     */
    getTime() {
        return this.globaltime;
    }

    /**
     * Returns the amount of time accumulated using the fixedtime_lapse let. This is used in context where the time increments should be constant
     * @method getFixedTime
     * @return {number} number of milliseconds the graph has been running
     */

    getFixedTime() {
        return this.fixedtime;
    }

    /**
     * Returns the amount of time it took to compute the latest iteration. Take into account that this number could be not correct
     * if the nodes are using graphical actions
     * @method getElapsedTime
     * @return {number} number of milliseconds it took the last cycle
     */

    getElapsedTime() {
        return this.elapsed_time;
    }

    /**
     * Sends an event to all the nodes, useful to trigger stuff
     * @method sendEventToAllNodes
     * @param {String} eventname the name of the event (function to be called)
     * @param {Array} params parameters in array format
     */
    sendEventToAllNodes(eventname: string, params?:any[], mode?:number) {
        mode = mode || LiteGraph.ALWAYS;

        const nodes = this._nodes_in_order ? this._nodes_in_order : this._nodes;
        if (!nodes) {
            return;
        }

        for (let j = 0, l = nodes.length; j < l; ++j) {
            const node:LGraphNode&any = nodes[j];
            if (
                node.constructor === LiteGraph.Subgraph &&
                eventname != 'onExecute'
            ) {
                if (node.mode == mode) {
                    //Maybe this is wrong
                    //@ts-ignore
                    node.sendEventToAllNodes(eventname, params, mode);
                }
                continue;
            }

            if (!node[eventname] || node.mode != mode) {
                continue;
            }
            if (params === undefined) {
                node[eventname]();
            } else if (params && params.constructor === Array) {
                node[eventname].apply(node, params);
            } else {
                node[eventname](params);
            }
        }
    }

    sendActionToCanvas(action: string, params?:any) {
        if (!this.list_of_graphcanvas) {
            return;
        }

        for (let i = 0; i < this.list_of_graphcanvas.length; ++i) {
            const c:any = this.list_of_graphcanvas[i];
            if (c[action]) {
                c[action].apply(c, params);
            }
        }
    }

    /**
     * Adds a new node instance to this graph
     * @method add
     * @param {LGraphNode} node the instance of the node
     */

    add(node:LGraphNode|LGraphGroup, skip_compute_order: boolean | undefined) {
        if (!node) {
            return;
        }

        // groups
        if (node.constructor === LGraphGroup) {
            this._groups.push(node);
            this.setDirtyCanvas(true);
            this.change();
            node.graph = this;
            this._version++;
            return;
        }
        if(node instanceof LGraphNode){

            // nodes
            if (node.id != -1 && this._nodes_by_id[node.id] != null) {
                console.warn(
                    'LiteGraph: there is already a node with this ID, changing it'
                    );
                    node.id = ++this.last_node_id;
                }
                
                if (this._nodes.length >= LiteGraph.MAX_NUMBER_OF_NODES) {
                    throw 'LiteGraph: max number of nodes in a graph reached';
                }
                
        // give him an id
        if (node.id == null || node.id == -1) {
            node.id = ++this.last_node_id;
        } else if (this.last_node_id < node.id) {
            this.last_node_id = node.id;
        }
        
        node.graph = this;
        this._version++;
        
        this._nodes.push(node);
        this._nodes_by_id[node.id] = node;
        
        if (node.onAdded) {
            node.onAdded(this);
        }
        
        if (this.config.align_to_grid) {
            node.alignToGrid();
        }
        
        if (!skip_compute_order) {
            this.updateExecutionOrder();
        }
        
        if (this.onNodeAdded) {
            this.onNodeAdded(node);
        }
        
        this.setDirtyCanvas(true);
        this.change();
        
        return node; // to chain actions
    }
    }

    /**
     * Removes a node from the graph
     * @method remove
     * @param {LGraphNode} node the instance of the node
     */

    remove(node: LGraphGroup|LGraphNode) {
        if (node instanceof LGraphGroup) {
            const index = this._groups.indexOf(node);
            if (index != -1) {
                this._groups.splice(index, 1);
            }
            node.graph = null;
            this._version++;
            this.setDirtyCanvas(true, true);
            this.change();
            return;
        } else {           
            if (this._nodes_by_id[node.id] == null) {
                return;
            } // not found
            
            if (node.ignore_remove) {
            return;
        } // cannot be removed

        this.beforeChange(); // sure?

        // disconnect inputs
        if (node.inputs) {
            for (let i = 0; i < node.inputs.length; i++) {
                const slot = node.inputs[i];
                if (slot.link != null) {
                    node.disconnectInput(i);
                }
            }
        }
        
        // disconnect outputs
        if (node.outputs) {
            for (let i = 0; i < node.outputs.length; i++) {
                const slot = node.outputs[i];
                if (slot.links != null && slot.links.length) {
                    node.disconnectOutput(i);
                }
            }
        }
        
        // node.id = -1; //why?
        
        // callback
        if (node.onRemoved) {
            node.onRemoved();
        }
        
        node.graph = null;
        this._version++;
        
        // remove from canvas render
        if (this.list_of_graphcanvas) {
            for (let i = 0; i < this.list_of_graphcanvas.length; ++i) {
                const canvas = this.list_of_graphcanvas[i];
                if (canvas.selected_nodes[node.id]) {
                    delete canvas.selected_nodes[node.id];
                }
                if (canvas.node_dragged == node) {
                    canvas.node_dragged = null;
                }
            }
        }
        
        // remove from containers
        const pos = this._nodes.indexOf(node);
        if (pos != -1) {
            this._nodes.splice(pos, 1);
        }
        delete this._nodes_by_id[node.id];
        
        if (this.onNodeRemoved) {
            this.onNodeRemoved(node);
        }

        // close panels
        this.sendActionToCanvas('checkPanels');
        
        this.setDirtyCanvas(true, true);
        this.afterChange(); // sure?
        this.change();
        
        this.updateExecutionOrder();
    }
}

    /**
     * Returns a node by its id.
     * @method getNodeById
     * @param {Number} id
     */

    getNodeById(id: number) {
        if (id == null) {
            return null;
        }
        return this._nodes_by_id[id];
    }

    /**
     * Returns a list of nodes that matches a class
     * @method findNodesByClass
     * @param {Class} classObject the class itself (not an string)
     * @return {Array} a list with all the nodes of this type
     */
    findNodesByClass<T extends LGraphNode>(classObject: LGraphNodeConstructor<T>,result:T[]): T[] {
        result = result || []
        result.length = 0;
        for (let i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].constructor === classObject) {
                result.push(this._nodes[i] as T);
            }
        }
        return result as T[];
    }

    /**
     * Returns a list of nodes that matches a type
     * @method findNodesByType
     * @param {String} type the name of the node type
     * @return {Array} a list with all the nodes of this type
     */
    findNodesByType<T extends LGraphNode = LGraphNode>(type: string, result:T[]): T[] {
        type = type.toLowerCase();
        result = result || [];
        result.length = 0;
        for (let i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].type?.toLowerCase() == type) {
                result.push(this._nodes[i] as T);
            }
        }
        return result as T[];
    }

    /**
     * Returns the first node that matches a name in its title
     * @method findNodeByTitle
     * @param {String} name the name of the node to search
     * @return {Node} the node or null
     */
    findNodeByTitle<T extends LGraphNode = LGraphNode>(title: string):T|null {
        for (let i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].title == title) {
                return this._nodes[i] as T;
            }
        }
        return null;
    }

    /**
     * Returns a list of nodes that matches a name
     * @method findNodesByTitle
     * @param {String} name the name of the node to search
     * @return {Array} a list with all the nodes with this name
     */
    findNodesByTitle<T extends LGraphNode = LGraphNode>(title: string):T[] {
        const result = [];
        for (let i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].title == title) {
                result.push(this._nodes[i]);
            }
        }
        return result as T[];
    }

    /**
     * Returns the top-most node in this position of the canvas
     * @method getNodeOnPos
     * @param {number} x the x coordinate in canvas space
     * @param {number} y the y coordinate in canvas space
     * @param {Array} nodes_list a list with all the nodes to search from, by default is all the nodes in the graph
     * @return {LGraphNode} the node at this position or null
     */
    getNodeOnPos<T extends LGraphNode = LGraphNode>(
        x: number,
        y: number,
        nodes_list?: LGraphNode[],
        margin?: number
    ): T | null {
        nodes_list = nodes_list || this._nodes;
        for (let i = nodes_list.length - 1; i >= 0; i--) {
            const n = nodes_list[i];
            if (n.isPointInside(x, y, margin)) {
                return n as T;
            }
        }
        return null;
    }

    /**
     * Returns the top-most group in that position
     * @method getGroupOnPos
     * @param {number} x the x coordinate in canvas space
     * @param {number} y the y coordinate in canvas space
     * @return {LGraphGroup} the group or null
     */
    getGroupOnPos(x: any, y: any) {
        for (let i = this._groups.length - 1; i >= 0; i--) {
            const g = this._groups[i];
            if (g.isPointInside(x, y, 2, true)) {
                return g;
            }
        }
        return null;
    }

    /**
     * Checks that the node type matches the node type registered, used when replacing a nodetype by a newer version during execution
     * this replaces the ones using the old version with the new version
     * @method checkNodeTypes
     */
    checkNodeTypes() {
        let changes = false;
        for (let i = 0; i < this._nodes.length; i++) {
            const node = this._nodes[i];
            if(node.type){

                const ctor = LiteGraph.registered_node_types[node.type];
                if (node.constructor == ctor) {
                    continue;
                }
                console.log('node being replaced by newer version: ' + node.type);
                const newnode = LiteGraph.createNode(node.type);
                changes = true;
                this._nodes[i] = newnode;
                newnode.configure(node.serialize());
                newnode.graph = this;
                this._nodes_by_id[newnode.id] = newnode;
            if (node.inputs) {
                newnode.inputs = node.inputs.concat();
            }
            if (node.outputs) {
                newnode.outputs = node.outputs.concat();
            }
        }
        }
        this.updateExecutionOrder();
    }

    // ********** GLOBALS *****************

    onAction(action: any, param: any) {
        for (let i = 0; i < this._input_nodes.length; ++i) {
            const node = this._input_nodes[i];
            if (node.properties.name != action) {
                continue;
            }
            node.onAction(action, param);
            break;
        }
    }

    trigger(action: any, param: any) {
        if (this.onTrigger) {
            this.onTrigger(action, param);
        }
    }

    /**
     * Tell this graph it has a global graph input of this type
     * @method addGlobalInput
     * @param {String} name
     * @param {String} type
     * @param {*} value [optional]
     */
    addInput(name: string | number, type: any, value: any) {
        const input = this.inputs[name];
        if (input) {
            // already exist
            return;
        }

        this.beforeChange();
        this.inputs[name] = { name: name, type: type, value: value };
        this._version++;
        this.afterChange();

        if (this.onInputAdded) {
            this.onInputAdded(name, type);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
    }

    /**
     * Assign a data to the global graph input
     * @method setGlobalInputData
     * @param {String} name
     * @param {*} data
     */
    setInputData(name: string | number, data: any) {
        const input = this.inputs[name];
        if (!input) {
            return;
        }
        input.value = data;
    }

    /**
     * Returns the current value of a global graph input
     * @method getInputData
     * @param {String} name
     * @return {*} the data
     */
    getInputData(name: string | number) {
        const input = this.inputs[name];
        if (!input) {
            return null;
        }
        return input.value;
    }

    /**
     * Changes the name of a global graph input
     * @method renameInput
     * @param {String} old_name
     * @param {String} new_name
     */
    renameInput(old_name: string | number, name: string | number) {
        if (name == old_name) {
            return;
        }

        if (!this.inputs[old_name]) {
            return false;
        }

        if (this.inputs[name]) {
            console.error('there is already one input with that name');
            return false;
        }

        this.inputs[name] = this.inputs[old_name];
        delete this.inputs[old_name];
        this._version++;

        if (this.onInputRenamed) {
            this.onInputRenamed(old_name, name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
    }

    /**
     * Changes the type of a global graph input
     * @method changeInputType
     * @param {String} name
     * @param {String} type
     */
    changeInputType(name: string | number, type: string) {
        if (!this.inputs[name]) {
            return false;
        }

        if (
            this.inputs[name].type &&
            String(this.inputs[name].type).toLowerCase() ==
                String(type).toLowerCase()
        ) {
            return;
        }

        this.inputs[name].type = type;
        this._version++;
        if (this.onInputTypeChanged) {
            this.onInputTypeChanged(name, type);
        }
    }

    /**
     * Removes a global graph input
     * @method removeInput
     * @param {String} name
     */
    removeInput(name: string | number) {
        if (!this.inputs[name]) {
            return false;
        }

        delete this.inputs[name];
        this._version++;

        if (this.onInputRemoved) {
            this.onInputRemoved(name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
        return true;
    }

    /**
     * Creates a global graph output
     * @method addOutput
     * @param {String} name
     * @param {String} type
     * @param {*} value
     */
    addOutput(name: string, type: string, value: any) {
        this.outputs[name] = { name: name, type: type, value: value };
        this._version++;

        if (this.onOutputAdded) {
            this.onOutputAdded(name, type);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
    }

    /**
     * Assign a data to the global output
     * @method setOutputData
     * @param {String} name
     * @param {String} value
     */
    setOutputData(name: string, value: string) {
        const output = this.outputs[name];
        if (!output) {
            return;
        }
        output.value = value;
    }

    /**
     * Returns the current value of a global graph output
     * @method getOutputData
     * @param {String} name
     * @return {*} the data
     */
    getOutputData(name: string) {
        const output = this.outputs[name];
        if (!output) {
            return null;
        }
        return output.value;
    }

    /**
     * Renames a global graph output
     * @method renameOutput
     * @param {String} old_name
     * @param {String} new_name
     */
    renameOutput(old_name: string, name: string) {
        if (!this.outputs[old_name]) {
            return false;
        }

        if (this.outputs[name]) {
            console.error('there is already one output with that name');
            return false;
        }

        this.outputs[name] = this.outputs[old_name];
        delete this.outputs[old_name];
        this._version++;

        if (this.onOutputRenamed) {
            this.onOutputRenamed(old_name, name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
    }

    /**
     * Changes the type of a global graph output
     * @method changeOutputType
     * @param {String} name
     * @param {String} type
     */
    changeOutputType(name: string , type: string) {
        if (!this.outputs[name]) {
            return false;
        }

        if (
            this.outputs[name].type &&
            String(this.outputs[name].type).toLowerCase() ==
                String(type).toLowerCase()
        ) {
            return;
        }

        this.outputs[name].type = type;
        this._version++;
        if (this.onOutputTypeChanged) {
            this.onOutputTypeChanged(name, type);
        }
    }

    /**
     * Removes a global graph output
     * @method removeOutput
     * @param {String} name
     */
    removeOutput(name: string | number) {
        if (!this.outputs[name]) {
            return false;
        }
        delete this.outputs[name];
        this._version++;

        if (this.onOutputRemoved) {
            this.onOutputRemoved(name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
        return true;
    }

    triggerInput(name: any, value: any) {
        const nodes = this.findNodesByTitle(name);
        for (let i = 0; i < nodes.length; ++i) {
            nodes[i].trigger(name,value);
        }
    }

    setCallback(name: any, func: any) {
        const nodes = this.findNodesByTitle(name);
        for (let i = 0; i < nodes.length; ++i) {
            //maybe wrong
            // @ts-ignore
            nodes[i].setTrigger(func);
        }
    }

    // used for undo, called before any change is made to the graph
    beforeChange(info?: undefined) {
        if (this.onBeforeChange) {
            this.onBeforeChange(this, info);
        }
        this.sendActionToCanvas('onBeforeChange', this);
    }

    // used to resend actions, called after any change is made to the graph
    afterChange(info?: undefined) {
        if (this.onAfterChange) {
            this.onAfterChange(this, info);
        }
        this.sendActionToCanvas('onAfterChange', this);
    }

    connectionChange(node: LGraphNode) {
        this.updateExecutionOrder();
        if (this.onConnectionChange) {
            this.onConnectionChange(node);
        }
        this._version++;
        this.sendActionToCanvas('onConnectionChange');
    }

    /**
     * returns if the graph is in live mode
     * @method isLive
     */

    isLive() {
        if (!this.list_of_graphcanvas) {
            return false;
        }

        for (let i = 0; i < this.list_of_graphcanvas.length; ++i) {
            const c = this.list_of_graphcanvas[i];
            if (c.live_mode) {
                return true;
            }
        }
        return false;
    }

    /**
     * clears the triggered slot animation in all links (stop visual animation)
     * @method clearTriggeredSlots
     */
    clearTriggeredSlots() {
        for (const i in this.links) {
            const link_info = this.links[i];
            if (!link_info) {
                continue;
            }
            if (link_info._last_time) {
                link_info._last_time = 0;
            }
        }
    }

    /* Called when something visually changed (not the graph!) */
    change() {
        if (LiteGraph.debug) {
            console.log('Graph changed');
        }
        this.sendActionToCanvas('setDirty', [true, true]);
        if (this.on_change) {
            this.on_change(this);
        }
    }

    setDirtyCanvas(fg: boolean, bg?: boolean) {
        this.sendActionToCanvas('setDirty', [fg, bg]);
    }

    /**
     * Destroys a link
     * @method removeLink
     * @param {Number} link_id
     */
    removeLink(link_id: number) {
        const link = this.links[link_id];
        if (!link) {
            return;
        }
        const node = this.getNodeById(link.target_id);
        if (node) {
            node.disconnectInput(link.target_slot);
        }
    }

    // save and recover app state ***************************************
    /**
     * Creates a Object containing all the info about this graph, it can be serialized
     * @method serialize
     * @return {Object} value of the node
     */
    serialize() {
        const nodes_info = [];
        for (let i = 0, l = this._nodes.length; i < l; ++i) {
            nodes_info.push(this._nodes[i].serialize());
        }

        // pack link info into a non-verbose format
        const links = [];
        for (const i in this.links) {
            // links is an OBJECT
            let link = this.links[i];
            if (!link.serialize) {
                // weird bug I havent solved yet
                console.warn(
                    'weird LLink bug, link info is not a LLink but a regular object'
                );
                const link2 = new LLink();
                for (const j in link) {
                    // @ts-ignore
                    link2[j] = link[j];
                }
                this.links[i] = link2;
                link = link2;
            }

            links.push(link.serialize());
        }

        const groups_info = [];
        for (let i = 0; i < this._groups.length; ++i) {
            groups_info.push(this._groups[i].serialize());
        }

        const data = {
            last_node_id: this.last_node_id,
            last_link_id: this.last_link_id,
            nodes: nodes_info,
            links: links,
            groups: groups_info,
            config: this.config,
            extra: this.extra,
            version: LiteGraph.VERSION,
        };

        if (this.onSerialize)
        { this.onSerialize(data); }

        return data ;
    }

    /**
     * Configure a graph from a JSON string
     * @method configure
     * @param {String} str configure a graph from a JSON string
     * @param {Boolean} returns if there was any error parsing
     */
    configure(data: { [x: string]: any; nodes: any; links: any[]; groups: string | any[]; extra: {}; }, keep_old?:boolean) {
        if (!data) {
            return;
        }

        if (!keep_old) {
            this.clear();
        }

        const nodes = data.nodes;

        // decode links info (they are very verbose)
        if (data.links && data.links.constructor === Array) {
            const links: never[] = [];
            for (let i = 0; i < data.links.length; ++i) {
                const link_data = data.links[i];
                if (!link_data) // weird bug
                {
                    console.warn('serialized graph link data contains errors, skipping.');
                    continue;
                }
                const link = new LLink();
                link.configure(link_data);
                links[link.id] = link;
            }
            data.links = links;
        }

        // copy all stored fields
        for (const i in data) {
            if (i == 'nodes' || i == 'groups') // links must be accepted
            { continue; }
            this[i] = data[i];
        }

        let error = false;

        // create nodes
        this._nodes = [];
        if (nodes) {
            for (let i = 0, l = nodes.length; i < l; ++i) {
                const n_info = nodes[i]; // stored info
                let node = LiteGraph.createNode(n_info.type, n_info.title);
                if (!node) {
                    if (LiteGraph.debug) {
                        console.log(
                            'Node not found or has errors: ' + n_info.type
                        );
                    }

                    // in case of error we create a replacement node to avoid losing info
                    node = new LGraphNode();
                    node.last_serialization = n_info;
                    node.has_errors = true;
                    error = true;
                    // continue;
                }

                node.id = n_info.id; // id it or it will create a new id
                this.add(node, true); // add before configure, otherwise configure cannot create links
            }

            // configure nodes afterwards so they can reach each other
            for (let i = 0, l = nodes.length; i < l; ++i) {
                const n_info = nodes[i];
                const node = this.getNodeById(n_info.id);
                if (node) {
                    node.configure(n_info);
                }
            }
        }

        // groups
        this._groups.length = 0;
        if (data.groups) {
            for (let i = 0; i < data.groups.length; ++i) {
                const group = new LiteGraph.LGraphGroup();
                group.configure(data.groups[i]);
                this.add(group);
            }
        }

        this.updateExecutionOrder();

        this.extra = data.extra || {};

        if (this.onConfigure)
        { this.onConfigure(data); }

        this._version++;
        this.setDirtyCanvas(true, true);
        return error;
    }

    load(url: string, callback?: () => void) {
        const that = this;

        // from file
        if (url.constructor === File || url.constructor === Blob)
        {
            const reader = new FileReader();
            reader.addEventListener('load', function(event) {
                // @ts-ignore
                const data = JSON.parse(event.target.result);
                that.configure(data);
                if (callback)
                { callback(); }
            });

            reader.readAsText(url);
            return;
        }

        // is a string, then an URL
        const req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.send(null);
        req.onload = function(oEvent) {
            if (req.status !== 200) {
                console.error('Error loading graph:', req.status, req.response);
                return;
            }
            const data = JSON.parse(req.response);
            that.configure(data);
            if (callback)
            { callback(); }
        };
        req.onerror = function(err) {
            console.error('Error loading graph:', err);
        };
    }

    onNodeTrace(node: any, msg: any, color: any) {
        // TODO
    }
    
static ContextMenu = ContextMenu;

static closeAllContextMenus(ref_window: Window & typeof globalThis) {
    ref_window = ref_window || window;

    const elements = ref_window.document.querySelectorAll('.litecontextmenu');
    if (!elements.length) {
        return;
    }

    const result = [];
    for (let i = 0; i < elements.length; i++) {
        result.push(elements[i]);
    }

    for (let i = 0; i < result.length; i++) {
        if (typeof result[i].close ==='function') {
            result[i].close();
        } else if (result[i].parentNode) {
            result[i].parentNode?.removeChild(result[i]);
        }
    }
};

static extendClass(target: { [x: string]: any; hasOwnProperty: (arg0: string) => any; prototype: { [x: string]: any; hasOwnProperty: (arg0: string) => any; __defineGetter__: (arg0: string, arg1: any) => void; __defineSetter__: (arg0: string, arg1: any) => void; }; }, origin: { [x: string]: any; prototype: { [x: string]: any; hasOwnProperty: (arg0: string) => any; __lookupGetter__: (arg0: string) => any; __lookupSetter__: (arg0: string) => any; }; }) {
    for (var i in origin) {
        // copy class properties
        if (target.hasOwnProperty(i)) {
            continue;
        }
        target[i] = origin[i];
    }

    if (origin.prototype) {
        // copy prototype properties
        for (var i in origin.prototype) {
            // only enumerable
            if (!origin.prototype.hasOwnProperty(i)) {
                continue;
            }

            if (target.prototype.hasOwnProperty(i)) {
                // avoid overwriting existing ones
                continue;
            }

            // copy getters
            if (origin.prototype.__lookupGetter__(i)) {
                target.prototype.__defineGetter__(
                        i,
                        origin.prototype.__lookupGetter__(i)
                );
            } else {
                target.prototype[i] = origin.prototype[i];
            }

            // and setters
            if (origin.prototype.__lookupSetter__(i)) {
                target.prototype.__defineSetter__(
                        i,
                        origin.prototype.__lookupSetter__(i)
                );
            }
        }
    }
};


static CurveEditor = CurveEditor;

// used to create nodes from wrapping functions
static getParameterNames(func: string) {
    return (func + '')
        .replace(/[/][/].*$/gm, '') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  /**/
        .split('){', 1)[0]
        .replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',')
        .filter(Boolean); // split & filter [""]
};

}

export type SerializedLGraphNode<T extends LGraphNode = LGraphNode> = {
    id: T["id"];
    type: T["type"];
    pos: T["pos"];
    size: T["size"];
    flags: T["flags"];
    mode: T["mode"];
    inputs: T["inputs"];
    outputs: T["outputs"];
    title: T["title"];
    properties: T["properties"];
    order: T['order']
    widgets_values?: IWidget["value"][];
    color?:T['color'];
    bgcolor?:T['bgcolor'];
    shape?:T['shape'];
    boxcolor?:T['boxcolor'];
};

interface ILGraphNodeProperty{
    title: string;
    type: null | string;
    size: Vector2;
    graph: null | LGraph;
    pos: Vector2;
    is_selected?: boolean;

    id: number;

    //inputs available: array of inputs
    inputs: INodeInputSlot[];
    outputs: INodeOutputSlot[];
    connections: any[];

    //local data
    properties: Record<string, any>;
    properties_info: any[];

    flags: Partial<{
        collapsed: boolean
    }>;

    color?: string;
    bgcolor?: string;
    boxcolor?: string;
    shape?:
        | typeof LiteGraph.BOX_SHAPE
        | typeof LiteGraph.ROUND_SHAPE
        | typeof LiteGraph.CIRCLE_SHAPE
        | typeof LiteGraph.CARD_SHAPE
        | typeof LiteGraph.ARROW_SHAPE;

    serialize_widgets?: boolean;
    skip_list?: boolean;

    /** Used in `LGraphCanvas.onMenuNodeMode` */
    mode?:
        | typeof LiteGraph.ON_EVENT
        | typeof LiteGraph.ON_TRIGGER
        | typeof LiteGraph.NEVER
        | typeof LiteGraph.ALWAYS;

    /** If set to true widgets do not start after the slots */
    widgets_up?: boolean;
    /** widgets start at y distance from the top of the node */
    widgets_start_y?: number;
    /** if you render outside the node, it will be clipped */
    clip_area?: boolean;
    /** if set to false it wont be resizable with the mouse */
    resizable?: boolean;
    /** slots are distributed horizontally */
    horizontal?: boolean;
}
interface ILGraphNodeStatic{
    static title_color?: string;
    static title: string;
    static type: null | string;
    static widgets_up?: boolean;
}
export interface ILGraphNodeMethods {

   

    /** configure a node from an object containing the serialized info */
    configure(info: SerializedLGraphNode): void;
    /** serialize the content */
    serialize(): SerializedLGraphNode;
    /** Creates a clone of this node  */
    clone(): this;
    /** serialize and stringify */
    toString(): string;
    /** get the title string */
    getTitle(): string;
    /** sets the output data */
    setOutputData(slot: number, data: any): void;
    /** sets the output data */
    setOutputDataType(slot: number, type: string): void;
    /**
     * Retrieves the input data (data traveling through the connection) from one slot
     * @param slot
     * @param force_update if set to true it will force the connected node of this slot to output data into this link
     * @return data or if it is not connected returns undefined
     */
    getInputData<T = any>(slot: number, force_update?: boolean): T;
    /**
     * Retrieves the input data type (in case this supports multiple input types)
     * @param slot
     * @return datatype in string format
     */
    getInputDataType(slot: number): string;
    /**
     * Retrieves the input data from one slot using its name instead of slot number
     * @param slot_name
     * @param force_update if set to true it will force the connected node of this slot to output data into this link
     * @return data or if it is not connected returns null
     */
    getInputDataByName<T = any>(slot_name: string, force_update?: boolean): T;
    /** tells you if there is a connection in one input slot */
    isInputConnected(slot: number): boolean;
    /** tells you info about an input connection (which node, type, etc) */
    getInputInfo(
        slot: number
    ): { link: number; name: string; type: string | 0 } | null;
    /** returns the node connected in the input slot */
    getInputNode(slot: number): LGraphNode | null;
    /** returns the value of an input with this name, otherwise checks if there is a property with that name */
    getInputOrProperty<T = any>(name: string): T;
    /** tells you the last output data that went in that slot */
    getOutputData<T = any>(slot: number): T | null;
    /** tells you info about an output connection (which node, type, etc) */
    getOutputInfo(
        slot: number
    ): { name: string; type: string; links: number[] } | null;
    /** tells you if there is a connection in one output slot */
    isOutputConnected(slot: number): boolean;
    /** tells you if there is any connection in the output slots */
    isAnyOutputConnected(): boolean;
    /** retrieves all the nodes connected to this output slot */
    getOutputNodes(slot: number): LGraphNode[];
    /**  Triggers an event in this node, this will trigger any output with the same name */
    trigger(action: string, param: any): void;
    /**
     * Triggers an slot event in this node
     * @param slot the index of the output slot
     * @param param
     * @param link_id in case you want to trigger and specific output link in a slot
     */
    triggerSlot(slot: number, param: any, link_id?: number): void;
    /**
     * clears the trigger slot animation
     * @param slot the index of the output slot
     * @param link_id in case you want to trigger and specific output link in a slot
     */
    clearTriggeredSlot(slot: number, link_id?: number): void;
    /**
     * add a new property to this node
     * @param name
     * @param default_value
     * @param type string defining the output type ("vec3","number",...)
     * @param extra_info this can be used to have special properties of the property (like values, etc)
     */
    addProperty(
        name: string,
        default_value: any,
        type: string,
        extra_info?: object
    );
    /**
     * add a new output slot to use in this node
     * @param name
     * @param type string defining the output type ("vec3","number",...)
     * @param extra_info this can be used to have special properties of an output (label, special color, position, etc)
     */
    addOutput(
        name: string,
        type: string | -1,
        extra_info?: Partial<INodeOutputSlot>
    ): INodeOutputSlot;
    /**
     * add a new output slot to use in this node
     * @param array of triplets like [[name,type,extra_info],[...]]
     */
    addOutputs(
        array: [string, string | -1, Partial<INodeOutputSlot> | undefined][]
    ): void;
    /** remove an existing output slot */
    removeOutput(slot: number): void;
    /**
     * add a new input slot to use in this node
     * @param name
     * @param type string defining the input type ("vec3","number",...), it its a generic one use 0
     * @param extra_info this can be used to have special properties of an input (label, color, position, etc)
     */
    addInput(
        name: string,
        type?: string | 0,
        extra_info?: Partial<INodeInputSlot>
    ): INodeInputSlot;
    /**
     * add several new input slots in this node
     * @param array of triplets like [[name,type,extra_info],[...]]
     */
    addInputs(
        array: [string, string | -1, Partial<INodeInputSlot> | undefined][]
    ): void;
    /** remove an existing input slot */
    removeInput(slot: number): void;
    /**
     * add an special connection to this node (used for special kinds of graphs)
     * @param name
     * @param type string defining the input type ("vec3","number",...)
     * @param pos position of the connection inside the node
     * @param direction if is input or output
     */
    addConnection(
        name: string,
        type: string,
        pos: Vector2,
        direction: string
    ): {
        name: string;
        type: string;
        pos: Vector2;
        direction: string;
        links: null;
    };
    setValue(v: any): void;
    /** computes the size of a node according to its inputs and output slots */
    computeSize(): [number, number];
    /**
     * https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#node-widgets
     * @return created widget
     */
    addWidget<T extends IWidget>(
        type: T["type"],
        name: string,
        value: T["value"],
        callback?: WidgetCallback<T> | string,
        options?: T["options"]
    ): T;

    addCustomWidget<T extends IWidget>(customWidget: T): T;

    /**
     * returns the bounding of the object, used for rendering purposes
     * @return [x, y, width, height]
     */
    getBounding(): Vector4;
    /** checks if a point is inside the shape of a node */
    isPointInside(
        x: number,
        y: number,
        margin?: number,
        skipTitle?: boolean
    ): boolean;
    /** checks if a point is inside a node slot, and returns info about which slot */
    getSlotInPosition(
        x: number,
        y: number
    ): {
        input?: INodeInputSlot;
        output?: INodeOutputSlot;
        slot: number;
        link_pos: Vector2;
    };
    /**
     * returns the input slot with a given name (used for dynamic slots), -1 if not found
     * @param name the name of the slot
     * @return the slot (-1 if not found)
     */
    findInputSlot(name: string): number;
    /**
     * returns the output slot with a given name (used for dynamic slots), -1 if not found
     * @param name the name of the slot
     * @return  the slot (-1 if not found)
     */
    findOutputSlot(name: string): number;
    /**
     * connect this node output to the input of another node
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @param  targetNode the target node
     * @param  targetSlot the input slot of the target node (could be the number of the slot or the string with the name of the slot, or -1 to connect a trigger)
     * @return {Object} the link_info is created, otherwise null
     */
    connect<T = any>(
        slot: number | string,
        targetNode: LGraphNode,
        targetSlot: number | string
    ): T | null;
    /**
     * disconnect one output to an specific node
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @param target_node the target node to which this slot is connected [Optional, if not target_node is specified all nodes will be disconnected]
     * @return if it was disconnected successfully
     */
    disconnectOutput(slot: number | string, targetNode: LGraphNode): boolean;
    /**
     * disconnect one input
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @return if it was disconnected successfully
     */
    disconnectInput(slot: number | string): boolean;
    /**
     * returns the center of a connection point in canvas coords
     * @param is_input true if if a input slot, false if it is an output
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @param out a place to store the output, to free garbage
     * @return the position
     **/
    getConnectionPos(
        is_input: boolean,
        slot: number | string,
        out?: Vector2
    ): Vector2;
    /** Force align to grid */
    alignToGrid(): void;
    /** Console output */
    trace(msg: string): void;
    /** Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
    setDirtyCanvas(fg: boolean, bg: boolean): void;
    loadImage(url: string): void;
    /** Allows to get onMouseMove and onMouseUp events even if the mouse is out of focus */
    captureInput(v: any): void;
    /** Collapse the node to make it smaller on the canvas */
    collapse(force: boolean): void;
    /** Forces the node to do not move or realign on Z */
    pin(v?: boolean): void;
    localToScreen(x: number, y: number, graphCanvas: LGraphCanvas): Vector2;


   

}




// *************************************************************
//   Node CLASS                                          *******
// *************************************************************

/*
	title: string
	pos: [x,y]
	size: [x,y]

	input|output: every connection
		+  { name:string, type:string, pos: [x,y]=Optional, direction: "input"|"output", links: Array });

	general properties:
		+ clip_area: if you render outside the node, it will be clipped
		+ unsafe_execution: not allowed for safe execution
		+ skip_repeated_outputs: when adding new outputs, it wont show if there is one already connected
		+ resizable: if set to false it wont be resizable with the mouse
		+ horizontal: slots are distributed horizontally
		+ widgets_start_y: widgets start at y distance from the top of the node
	
	flags object:
		+ collapsed: if it is collapsed

	supported callbacks:
		+ onAdded: when added to graph (warning: this is called BEFORE the node is configured when loading)
		+ onRemoved: when removed from graph
		+ onStart:	when the graph starts playing
		+ onStop:	when the graph stops playing
		+ onDrawForeground: render the inside widgets inside the node
		+ onDrawBackground: render the background area inside the node (only in edit mode)
		+ onMouseDown
		+ onMouseMove
		+ onMouseUp
		+ onMouseEnter
		+ onMouseLeave
		+ onExecute: execute the node
		+ onPropertyChanged: when a property is changed in the panel (return true to skip default behaviour)
		+ onGetInputs: returns an array of possible inputs
		+ onGetOutputs: returns an array of possible outputs
		+ onBounding: in case this node has a bigger bounding than the node itself (the callback receives the bounding as [x,y,w,h])
		+ onDblClick: double clicked in the node
		+ onInputDblClick: input slot double clicked (can be used to automatically create a node connected)
		+ onOutputDblClick: output slot double clicked (can be used to automatically create a node connected)
		+ onConfigure: called after the node has been configured
		+ onSerialize: to add extra info when serializing (the callback receives the object that should be filled with the data)
		+ onSelected
		+ onDeselected
		+ onDropItem : DOM item dropped over the node
		+ onDropFile : file dropped over the node
		+ onConnectInput : if returns false the incoming connection will be canceled
		+ onConnectionsChange : a connection changed (new one or removed) (LiteGraph.INPUT or LiteGraph.OUTPUT, slot, true if connected, link_info, input_info )
		+ onAction: action slot triggered
		+ getExtraMenuOptions: to add option to context menu
*/

/**
     * Base Class for all the node type classes
     * @class LGraphNode
     * @param {String} name a name for the node
     */
class LGraphNode implements ILGraphNodeMethods ,ILGraphNodeProperty ,ILGraphNodeStatic  {
    title: string;
    type: null | string;
    size: Vector2;
    graph: null | LGraph;
    pos!: Vector2;
    is_selected?: boolean;

    id: number;

    //inputs available: array of inputs
    inputs: INodeInputSlot[];
    outputs: INodeOutputSlot[];

    //local data
    properties: Record<string, any>;
    properties_info: { name: string, type: any, default_value: any }[];

    flags: Partial<{
        collapsed: boolean
    }>;

    color?: string;
    bgcolor?: string;
    boxcolor?: string;
    shape?:
        | typeof LiteGraph.BOX_SHAPE
        | typeof LiteGraph.ROUND_SHAPE
        | typeof LiteGraph.CIRCLE_SHAPE
        | typeof LiteGraph.CARD_SHAPE
        | typeof LiteGraph.ARROW_SHAPE;

    serialize_widgets?: boolean;
    skip_list?:boolean;

    /** Used in `LGraphCanvas.onMenuNodeMode` */
    mode?:
        | typeof LiteGraph.ON_EVENT
        | typeof LiteGraph.ON_TRIGGER
        | typeof LiteGraph.NEVER
        | typeof LiteGraph.ALWAYS;

    /** If set to true widgets do not start after the slots */
    widgets_up?: boolean;
    /** widgets start at y distance from the top of the node */
    widgets_start_y?: number;
    /** if you render outside the node, it will be clipped */
    clip_area?: boolean;
    /** if set to false it wont be resizable with the mouse */
    resizable?: boolean;
    /** slots are distributed horizontally */
    horizontal?: boolean;
    _pos: Float32Array;
    connections: {
            name: string,
            type: string,
            pos: Vector2,
            direction: string,
            links: null,
        }[];
    widgets: any;
    order: any;
    last_serialization: any;

    _level?:number
    _collapsed_width?: number;
    console: any;
    static MAX_CONSOLE: any;
    updateOutputData: any;
    _relative_id: never;
    ignore_remove?: boolean;
    subgraph?: boolean;
    skip_subgraph_button: any;
    mouseOver?: boolean;
    redraw_on_mouse: any;
    block_delete: any;
    onAction: any;
    onOutputRemoved: any;
    onInputRemoved: any;
    onGetPropertyInfo: boolean;
    onBounding: any;
    onOutputDblClick: any;
    onOutputClick: any;
    onInputDblClick: any;
    onInputClick: any;
    onDblClick: any;
    onKeyDown: any;
    onKeyUp: any;
    onDropFile: any;
    onDropData: any;
    onDropItem: any;
    constructor(title?:string) {
        this.title = title || 'Unnamed';
        this.size = [LiteGraph.NODE_WIDTH, 60];
        this.graph = null;

        this._pos = new Float32Array(10);

        Object.defineProperty(this, 'pos', {
            set: function(v) {
                if (!v || v.length < 2) {
                    return;
                }
                this._pos[0] = v[0];
                this._pos[1] = v[1];
            },
            get: function() {
                return this._pos;
            },
            enumerable: true,
        });

        this.id = -1; // not know till not added
        this.type = null;

        // inputs available: array of inputs
        this.inputs = [];
        this.outputs = [];
        this.connections = [];

        // local data
        this.properties = {}; // for the values
        this.properties_info = []; // for the info

        this.flags = {};
    }
    title_color?: string;


        // https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#custom-node-appearance
    onDrawBackground?(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement
    ): void;
    onDrawForeground?(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement
    ): void;
    /**when a property is changed in the panel (return true to skip default behaviour) */
    onPropertyChanged?(property:string|number,value:any):boolean;
    // https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#custom-node-behaviour
    onMouseDown?(
        event: MouseEvent,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;
    onMouseMove?(
        event: MouseEvent,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;
    onMouseUp?(
        event: MouseEvent,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;
    onMouseEnter?(
        event: MouseEvent,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;
    onMouseLeave?(
        event: MouseEvent,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;
    onKey?(event: KeyboardEvent, pos: Vector2, graphCanvas: LGraphCanvas): void;

    
    /** Called by `LGraphCanvas.selectNodes` */
    onSelected?(): void;
    /** Called by `LGraphCanvas.deselectNode` */
    onDeselected?(): void;
    /** Called by `LGraph.runStep` `LGraphNode.getInputData` */
    onExecute?(): void;
    /** Called by `LGraph.serialize` */
    onSerialize?(o: SerializedLGraphNode): void;
    /** Called by `LGraph.configure` */
    onConfigure?(o: SerializedLGraphNode): void;
    /**
     * when added to graph (warning: this is called BEFORE the node is configured when loading)
     * Called by `LGraph.add`
     */
    onAdded?(graph: LGraph): void;
    /**
     * when removed from graph
     * Called by `LGraph.remove` `LGraph.clear`
     */
    onRemoved?(): void;
    /**
     * if returns false the incoming connection will be canceled
     * Called by `LGraph.connect`
     * @param inputIndex target input slot number
     * @param outputType type of output slot
     * @param outputSlot output slot object
     * @param outputNode node containing the output
     * @param outputIndex index of output slot
     */
    onConnectInput?(
        inputIndex: number,
        outputType: INodeOutputSlot["type"],
        outputSlot: INodeOutputSlot,
        outputNode: LGraphNode,
        outputIndex: number
    ): boolean;
    /**
     * if returns false the incoming connection will be canceled
     * Called by `LGraph.connect`
     * @param outputIndex target output slot number
     * @param inputType type of input slot
     * @param inputSlot input slot object
     * @param inputNode node containing the input
     * @param inputIndex index of input slot
     */
    onConnectOutput?(
        outputIndex: number,
        inputType: INodeInputSlot["type"],
        inputSlot: INodeInputSlot,
        inputNode: LGraphNode,
        inputIndex: number
    ): boolean;

    /**
     * Called just before connection (or disconnect - if input is linked).
     * A convenient place to switch to another input, or create new one.
     * This allow for ability to automatically add slots if needed
     * @param inputIndex
     * @return selected input slot index, can differ from parameter value
     */
    onBeforeConnectInput?(
        inputIndex: number
    ): number;
    
    /** Called by `LGraphCanvas.processContextMenu` */
    getMenuOptions?(graphCanvas: LGraphCanvas): ContextMenuItem[];
    getSlotMenuOptions?(slot: INodeSlot): ContextMenuItem[];

    /** a connection changed (new one or removed) (LiteGraph.INPUT or LiteGraph.OUTPUT, slot, true if connected, link_info, input_info or output_info ) */
    onConnectionsChange?(
        type: number,
        slotIndex: number,
        isConnected: boolean,
        link: LLink|null,
        ioSlot: (INodeOutputSlot | INodeInputSlot)
    ): void;
    /**
     * configure a node from an object containing the serialized info
     * @method configure
     */
    configure(info: SerializedLGraphNode<LGraphNode>) {
        if (this.graph) {
            this.graph._version++;
        }
        for (let j in info) {
            if (j == 'properties') {
            // i don't want to clone properties, I want to reuse the old container
                for (const k in info.properties) {
                    this.properties[k] = info.properties[k];
                    if (this.onPropertyChanged) {
                        this.onPropertyChanged(k, info.properties[k]);
                    }
                }
                continue;
            }
            // @ts-ignore
            if (info[j] == null) {
                continue;
                // @ts-ignore
            } else if (typeof info[j] === 'object') {
            // object
                // @ts-ignore
                if (this[j] && this[j].configure) {
                    // @ts-ignore
                    this[j].configure(info[j]);
                } else {
                    // @ts-ignore
                    this[j] = LiteGraph.cloneObject(info[j], this[j]);
                }
            } // value
            else {
                // @ts-ignore
                this[j] = info[j];
            }
        }

        if (!info.title) {
            this.title = this.constructor.title;
        }

        if (this.onConnectionsChange) {
            if (this.inputs) {
                for (var i = 0; i < this.inputs.length; ++i) {
                    const input = this.inputs[i];
                    var link_info = this.graph&&input.link
                        ? this.graph.links[input.link]
                        : null;
                    this.onConnectionsChange(
                        LiteGraph.INPUT,
                        i,
                        true,
                        link_info,
                        input
                    ); // link_info has been created now, so its updated
                }
            }

            if (this.outputs) {
                for (var i = 0; i < this.outputs.length; ++i) {
                    const output = this.outputs[i];
                    if (!output.links) {
                        continue;
                    }
                    for (let j = 0; j < output.links.length; ++j) {
                        var link_info = this.graph
                            ? this.graph.links[output.links[j]]
                            : null;
                        this.onConnectionsChange(
                            LiteGraph.OUTPUT,
                            i,
                            true,
                            link_info,
                            output
                        ); // link_info has been created now, so its updated
                    }
                }
            }
        }

        if (this.widgets)
        {
            for (var i = 0; i < this.widgets.length; ++i)
            {
                const w = this.widgets[i];
                if (!w)
                { continue; }
                if (w.options && w.options.property && this.properties[ w.options.property ])
                { w.value = JSON.parse(JSON.stringify(this.properties[ w.options.property ])); }
            }
            if (info.widgets_values) {
                for (var i = 0; i < info.widgets_values.length; ++i) {
                    if (this.widgets[i]) {
                        this.widgets[i].value = info.widgets_values[i];
                    }
                }
            }
        }

        if (this.onConfigure) {
            this.onConfigure(info);
        }
    }
    /**
     * serialize the content
     * @method serialize
     */

    serialize():SerializedLGraphNode {
    // create serialization object
        const o:Partial<SerializedLGraphNode> = {
            id: this.id,
            type: this.type,
            pos: this.pos,
            size: this.size,
            flags: LiteGraph.cloneObject(this.flags),
            order: this.order,
            mode: this.mode,
        };

        // special case for when there were errors
        if (this.constructor === LGraphNode && this.last_serialization) {
            return this.last_serialization;
        }

        if (this.inputs) {
            o.inputs = this.inputs;
        }

        if (this.outputs) {
        // clear outputs last data (because data in connections is never serialized but stored inside the outputs info)
            for (var i = 0; i < this.outputs.length; i++) {
                delete this.outputs[i]._data;
            }
            o.outputs = this.outputs;
        }

        if (this.title && this.title != this.constructor.title) {
            o.title = this.title;
        }

        if (this.properties) {
            o.properties = LiteGraph.cloneObject(this.properties);
        }

        if (this.widgets && this.serialize_widgets) {
            o.widgets_values = [];
            for (var i = 0; i < this.widgets.length; ++i) {
                if (this.widgets[i])
	                { o.widgets_values[i] = this.widgets[i].value; }
                else
                { o.widgets_values[i] = null; }
            }
        }

        if (!o.type) {
            o.type = this.constructor.type;
        }

        if (this.color) {
            o.color = this.color;
        }
        if (this.bgcolor) {
            o.bgcolor = this.bgcolor;
        }
        if (this.boxcolor) {
            o.boxcolor = this.boxcolor;
        }
        if (this.shape) {
            o.shape = this.shape;
        }

        if (this.onSerialize) {
            if (this.onSerialize(o)) {
                console.warn(
                    'node onSerialize shouldnt return anything, data should be stored in the object pass in the first parameter'
                );
            }
        }

        return o;
    }
    /* Creates a clone of this node */
    clone() {
        const node = LiteGraph.createNode(this.type);
        if (!node) {
            return null;
        }

        // we clone it because serialize returns shared containers
        const data = LiteGraph.cloneObject(this.serialize());

        // remove links
        if (data.inputs) {
            for (var i = 0; i < data.inputs.length; ++i) {
                data.inputs[i].link = null;
            }
        }

        if (data.outputs) {
            for (var i = 0; i < data.outputs.length; ++i) {
                if (data.outputs[i].links) {
                    data.outputs[i].links.length = 0;
                }
            }
        }

        delete data['id'];
        // remove links
        node.configure(data);

        return node;
    }
    /**
     * serialize and stringify
     * @method toString
     */

    toString() {
        return JSON.stringify(this.serialize());
    }
    // deserialize =()(info) {} //this cannot be done from within, must be done in LiteGraph

    /**
     * get the title string
     * @method getTitle
     */

    getTitle() {
        return this.title || this.constructor.title;
    }

    /**
     * sets the value of a property
     * @method setProperty
     * @param {String} name
     * @param {*} value
     */
    setProperty(name: string | number, value: any) {
        if (!this.properties) {
            this.properties = {};
        }
        if (value === this.properties[name])
        { return; }
        const prev_value = this.properties[name];
        this.properties[name] = value;
        if (this.onPropertyChanged) {
            if (this.onPropertyChanged(name, value, prev_value) === false) // abort change
            { this.properties[name] = prev_value; }
        }
        if (this.widgets) // widgets could be linked to properties
        { for (let i = 0; i < this.widgets.length; ++i)
        {
            const w = this.widgets[i];
            if (!w)
            { continue; }
            if (w.options.property == name)
            {
                w.value = value;
                break;
            }
        } }
    }

    // Execution *************************
    /**
     * sets the output data
     * @method setOutputData
     * @param {number} slot
     * @param {*} data
     */
    setOutputData(slot: number, data: any) {
        if (!this.outputs) {
            return;
        }

        // this maybe slow and a niche case
        // if(slot && slot.constructor === String)
        //	slot = this.findOutputSlot(slot);

        if (slot == -1 || slot >= this.outputs.length) {
            return;
        }

        const output_info = this.outputs[slot];
        if (!output_info) {
            return;
        }

        // store data in the output itself in case we want to debug
        output_info._data = data;

        // if there are connections, pass the data to the connections
        if (this.outputs[slot].links) {
            const links = this.outputs[slot].links as number[]
            for (let i = 0; i < links.length; i++) {
                const link_id = links[i];
                const link = this.graph.links[link_id];
                if (link)
                { link.data = data; }
            }
        }
    }

    /**
     * sets the output data type, useful when you want to be able to overwrite the data type
     * @method setOutputDataType
     * @param {number} slot
     * @param {String} datatype
     */
    setOutputDataType(slot: number, type: any) {
        if (!this.outputs) {
            return;
        }
        if (slot == -1 || slot >= this.outputs.length) {
            return;
        }
        const output_info = this.outputs[slot];
        if (!output_info) {
            return;
        }
        // store data in the output itself in case we want to debug
        output_info.type = type;

        // if there are connections, pass the data to the connections
        if (this.outputs[slot].links) {
            for (let i = 0; i < this.outputs[slot].links.length; i++) {
                const link_id = this.outputs[slot].links[i];
                this.graph.links[link_id].type = type;
            }
        }
    }

    /**
     * Retrieves the input data (data traveling through the connection) from one slot
     * @method getInputData
     * @param {number} slot
     * @param {boolean} force_update if set to true it will force the connected node of this slot to output data into this link
     * @return {*} data or if it is not connected returns undefined
     */
    getInputData(slot: number, force_update: any) {
        if (!this.inputs) {
            return;
        } // undefined;

        if (slot >= this.inputs.length || this.inputs[slot].link == null) {
            return;
        }

        const link_id = this.inputs[slot].link;
        const link = this.graph.links[link_id];
        if (!link) {
        // bug: weird case but it happens sometimes
            return null;
        }

        if (!force_update) {
            return link.data;
        }

        // special case: used to extract data from the incoming connection before the graph has been executed
        const node = this.graph.getNodeById(link.origin_id);
        if (!node) {
            return link.data;
        }

        if (node.updateOutputData) {
            node.updateOutputData(link.origin_slot);
        } else if (node.onExecute) {
            node.onExecute();
        }

        return link.data;
    }

    /**
     * Retrieves the input data type (in case this supports multiple input types)
     * @method getInputDataType
     * @param {number} slot
     * @return {String} datatype in string format
     */
    getInputDataType(slot: number) {
        if (!this.inputs) {
            return null;
        } // undefined;

        if (slot >= this.inputs.length || this.inputs[slot].link == null) {
            return null;
        }
        const link_id = this.inputs[slot].link;
        const link = this.graph.links[link_id];
        if (!link) {
        // bug: weird case but it happens sometimes
            return null;
        }
        const node = this.graph.getNodeById(link.origin_id);
        if (!node) {
            return link.type;
        }
        const output_info = node.outputs[link.origin_slot];
        if (output_info) {
            return output_info.type;
        }
        return null;
    }

    /**
     * Retrieves the input data from one slot using its name instead of slot number
     * @method getInputDataByName
     * @param {String} slot_name
     * @param {boolean} force_update if set to true it will force the connected node of this slot to output data into this link
     * @return {*} data or if it is not connected returns null
     */
    getInputDataByName(
        slot_name: any,
        force_update: any
    ) {
        const slot = this.findInputSlot(slot_name);
        if (slot == -1) {
            return null;
        }
        return this.getInputData(slot, force_update);
    }

    /**
     * tells you if there is a connection in one input slot
     * @method isInputConnected
     * @param {number} slot
     * @return {boolean}
     */
    isInputConnected(slot: number) {
        if (!this.inputs) {
            return false;
        }
        return slot < this.inputs.length && this.inputs[slot].link != null;
    }

    /**
     * tells you info about an input connection (which node, type, etc)
     * @method getInputInfo
     * @param {number} slot
     * @return {Object} object or null { link: id, name: string, type: string or 0 }
     */
    getInputInfo(slot: number) {
        if (!this.inputs) {
            return null;
        }
        if (slot < this.inputs.length) {
            return this.inputs[slot];
        }
        return null;
    }

    /**
     * Returns the link info in the connection of an input slot
     * @method getInputLink
     * @param {number} slot
     * @return {LLink} object or null
     */
    getInputLink(slot: number) {
        if (!this.inputs) {
            return null;
        }
        if (slot < this.inputs.length) {
            const slot_info = this.inputs[slot];
            return this.graph.links[ slot_info.link ];
        }
        return null;
    }

    /**
     * returns the node connected in the input slot
     * @method getInputNode
     * @param {number} slot
     * @return {LGraphNode} node or null
     */
    getInputNode(slot: number) {
        if (!this.inputs) {
            return null;
        }
        if (slot >= this.inputs.length) {
            return null;
        }
        const input = this.inputs[slot];
        if (!input || input.link === null) {
            return null;
        }
        const link_info = this.graph.links[input.link];
        if (!link_info) {
            return null;
        }
        return this.graph.getNodeById(link_info.origin_id);
    }

    /**
     * returns the value of an input with this name, otherwise checks if there is a property with that name
     * @method getInputOrProperty
     * @param {string} name
     * @return {*} value
     */
    getInputOrProperty(name: string | number) {
        if (!this.inputs || !this.inputs.length) {
            return this.properties ? this.properties[name] : null;
        }

        for (let i = 0, l = this.inputs.length; i < l; ++i) {
            const input_info = this.inputs[i];
            if (name == input_info.name && input_info.link != null) {
                const link = this.graph.links[input_info.link];
                if (link) {
                    return link.data;
                }
            }
        }
        return this.properties[name];
    }

    /**
     * tells you the last output data that went in that slot
     * @method getOutputData
     * @param {number} slot
     * @return {Object}  object or null
     */
    getOutputData(slot: number) {
        if (!this.outputs) {
            return null;
        }
        if (slot >= this.outputs.length) {
            return null;
        }

        const info = this.outputs[slot];
        return info._data;
    }

    /**
     * tells you info about an output connection (which node, type, etc)
     * @method getOutputInfo
     * @param {number} slot
     * @return {Object}  object or null { name: string, type: string, links: [ ids of links in number ] }
     */
    getOutputInfo(slot: number) {
        if (!this.outputs) {
            return null;
        }
        if (slot < this.outputs.length) {
            return this.outputs[slot];
        }
        return null;
    }

    /**
     * tells you if there is a connection in one output slot
     * @method isOutputConnected
     * @param {number} slot
     * @return {boolean}
     */
    isOutputConnected(slot: number) {
        if (!this.outputs) {
            return false;
        }
        return (
            slot < this.outputs.length &&
            this.outputs[slot].links &&
            this.outputs[slot].links.length
        );
    }

    /**
     * tells you if there is any connection in the output slots
     * @method isAnyOutputConnected
     * @return {boolean}
     */
    isAnyOutputConnected() {
        if (!this.outputs) {
            return false;
        }
        for (let i = 0; i < this.outputs.length; ++i) {
            if (this.outputs[i].links && this.outputs[i].links.length) {
                return true;
            }
        }
        return false;
    }

    /**
     * retrieves all the nodes connected to this output slot
     * @method getOutputNodes
     * @param {number} slot
     * @return {array}
     */
    getOutputNodes(slot: number) {
        if (!this.outputs || this.outputs.length == 0) {
            return null;
        }

        if (slot >= this.outputs.length) {
            return null;
        }

        const output = this.outputs[slot];
        if (!output.links || output.links.length == 0) {
            return null;
        }

        const r = [];
        for (let i = 0; i < output.links.length; i++) {
            const link_id = output.links[i];
            const link = this.graph.links[link_id];
            if (link) {
                const target_node = this.graph.getNodeById(link.target_id);
                if (target_node) {
                    r.push(target_node);
                }
            }
        }
        return r;
    }

    /**
     * Triggers an event in this node, this will trigger any output with the same name
     * @method trigger
     * @param {String} event name ( "on_play", ... ) if action is equivalent to false then the event is send to all
     * @param {*} param
     */
    trigger(action: any, param: any) {
        if (!this.outputs || !this.outputs.length) {
            return;
        }

        if (this.graph)
        { this.graph._last_trigger_time = LiteGraph.getTime(); }

        for (let i = 0; i < this.outputs.length; ++i) {
            const output = this.outputs[i];
            if (!output || output.type !== LiteGraph.EVENT || (action && output.name != action))
            { continue; }
            this.triggerSlot(i, param);
        }
    }

    /**
     * Triggers an slot event in this node
     * @method triggerSlot
     * @param {Number} slot the index of the output slot
     * @param {*} param
     * @param {Number} link_id [optional] in case you want to trigger and specific output link in a slot
     */
    triggerSlot(slot: number, param: any, link_id?: null) {
        if (!this.outputs) {
            return;
        }

        const output = this.outputs[slot];
        if (!output) {
            return;
        }

        const links = output.links;
        if (!links || !links.length) {
            return;
        }

        if (this.graph) {
            this.graph._last_trigger_time = LiteGraph.getTime();
        }

        // for every link attached here
        for (let k = 0; k < links.length; ++k) {
            const id = links[k];
            if (link_id != null && link_id != id) {
            // to skip links
                continue;
            }
            const link_info = this.graph?.links[links[k]];
            if (!link_info) {
            // not connected
                continue;
            }
            link_info._last_time = LiteGraph.getTime();
            const node = this.graph?.getNodeById(link_info.target_id);
            if (!node) {
            // node not found?
                continue;
            }

            // used to mark events in graph
            const target_connection = node.inputs[link_info.target_slot];

            if (node.mode === LiteGraph.ON_TRIGGER)
            {
                if (node.onExecute) {
                    node.onExecute(param);
                }
            }
            else if (node.onAction) {
                node.onAction(target_connection.name, param);
            }
        }
    }

    /**
     * clears the trigger slot animation
     * @method clearTriggeredSlot
     * @param {Number} slot the index of the output slot
     * @param {Number} link_id [optional] in case you want to trigger and specific output link in a slot
     */
    clearTriggeredSlot(slot: string | number, link_id: null) {
        if (!this.outputs) {
            return;
        }

        const output = this.outputs[slot];
        if (!output) {
            return;
        }

        const links = output.links;
        if (!links || !links.length) {
            return;
        }

        // for every link attached here
        for (let k = 0; k < links.length; ++k) {
            const id = links[k];
            if (link_id != null && link_id != id) {
            // to skip links
                continue;
            }
            const link_info = this.graph?.links[links[k]];
            if (!link_info) {
            // not connected
                continue;
            }
            link_info._last_time = 0;
        }
    }

    /**
     * changes node size and triggers callback
     * @method setSize
     * @param {vec2} size
     */
    setSize(size: Vector2)
    {
        this.size = size;
        if (this.onResize)
        { this.onResize(this.size); }
    }
    onResize?(size: Vector2);

    /**
     * add a new property to this node
     * @method addProperty
     * @param {string} name
     * @param {*} default_value
     * @param {string} type string defining the output type ("vec3","number",...)
     * @param {Object} extra_info this can be used to have special properties of the property (like values, etc)
     */
    addProperty<T = any>(
        name: string,
        default_value: any,
        type: string,
        extra_info: T
    ) {
        const o = { name: name, type: type, default_value: default_value };
        if (extra_info) {
            for (const i in extra_info) {
                // @ts-ignore
                o[i] = extra_info[i];
            }
        }
        if (!this.properties_info) {
            this.properties_info = [];
        }
        this.properties_info.push(o);
        if (!this.properties) {
            this.properties = {};
        }
        this.properties[name] = default_value;
        return o as typeof o & T;
    }

    // connections

    /**
     * add a new output slot to use in this node
     * @method addOutput
     * @param {string} name
     * @param {string} type string defining the output type ("vec3","number",...)
     * @param {Object} extra_info this can be used to have special properties of an output (label, special color, position, etc)
     */
    addOutput<T=any>(name: string, type: string, extra_info?: T) {
        const o:INodeOutputSlot = { name: name, type: type, links: null };
        if (extra_info) {
            for (const i in extra_info) {
                // @ts-ignore
                o[i] = extra_info[i];
            }
        }

        if (!this.outputs) {
            this.outputs = [];
        }
        this.outputs.push(o);
        if (this.onOutputAdded) {
            this.onOutputAdded(o);
        }
        this.setSize(this.computeSize());
        this.setDirtyCanvas(true, true);
        return o as INodeOutputSlot&T;
    }
    onOutputAdded?(o: INodeOutputSlot):void; 
    /**
     * add a new output slot to use in this node
     * @method addOutputs
     * @param {Array} array of triplets like [[name,type,extra_info],[...]]
     */
    addOutputs(array: string | any[]) {
        for (let i = 0; i < array.length; ++i) {
            const info = array[i];
            const o = { name: info[0], type: info[1], link: null };
            if (array[2]) {
                for (const j in info[2]) {
                    o[j] = info[2][j];
                }
            }

            if (!this.outputs) {
                this.outputs = [];
            }
            this.outputs.push(o);
            if (this.onOutputAdded) {
                this.onOutputAdded(o);
            }
        }

        this.setSize(this.computeSize());
        this.setDirtyCanvas(true, true);
    }

    /**
     * remove an existing output slot
     * @method removeOutput
     * @param {number} slot
     */
    removeOutput(slot: number) {
        this.disconnectOutput(slot);
        this.outputs.splice(slot, 1);
        for (let i = slot; i < this.outputs.length; ++i) {
            if (!this.outputs[i] || !this.outputs[i].links) {
                continue;
            }
            const links = this.outputs[i].links;
            for (let j = 0; j < links.length; ++j) {
                const link = this.graph.links[links[j]];
                if (!link) {
                    continue;
                }
                link.origin_slot -= 1;
            }
        }

        this.setSize(this.computeSize());
        if (this.onOutputRemoved) {
            this.onOutputRemoved(slot);
        }
        this.setDirtyCanvas(true, true);
    }

    /**
     * add a new input slot to use in this node
     * @method addInput
     * @param {string} name
     * @param {string} type string defining the input type ("vec3","number",...), it its a generic one use 0
     * @param {Object} extra_info this can be used to have special properties of an input (label, color, position, etc)
     */
    addInput(name: string, type?: string | 0, extra_info?: Partial<INodeInputSlot>) {
        type = type || 0;
        const o = { name: name, type: type, link: null } as INodeInputSlot;
        if (extra_info) {
            for (const i in extra_info) {
                // @ts-ignore
                o[i] = extra_info[i];
            }
        }

        if (!this.inputs) {
            this.inputs = [];
        }

        this.inputs.push(o);
        this.setSize(this.computeSize());

        if (this.onInputAdded) {
            this.onInputAdded(o);
        }

        this.setDirtyCanvas(true, true);
        return o ;
    }
    onInputAdded?(o: INodeInputSlot):void;

    /**
     * add several new input slots in this node
     * @method addInputs
     * @param {Array} array of triplets like [[name,type,extra_info],[...]]
     */
    addInputs(array: string | any[]) {
        for (let i = 0; i < array.length; ++i) {
            const info = array[i];
            const o = { name: info[0], type: info[1], link: null };
            if (array[2]) {
                for (const j in info[2]) {
                    o[j] = info[2][j];
                }
            }

            if (!this.inputs) {
                this.inputs = [];
            }
            this.inputs.push(o);
            if (this.onInputAdded) {
                this.onInputAdded(o);
            }
        }

        this.setSize(this.computeSize());
        this.setDirtyCanvas(true, true);
    }

    /**
     * remove an existing input slot
     * @method removeInput
     * @param {number} slot
     */
    removeInput(slot: number) {
        this.disconnectInput(slot);
        const slot_info = this.inputs.splice(slot, 1);
        for (let i = slot; i < this.inputs.length; ++i) {
            if (!this.inputs[i]) {
                continue;
            }
            const link = this.graph.links[this.inputs[i].link];
            if (!link) {
                continue;
            }
            link.target_slot -= 1;
        }
        this.setSize(this.computeSize());
        if (this.onInputRemoved) {
            this.onInputRemoved(slot, slot_info[0]);
        }
        this.setDirtyCanvas(true, true);
    }

    /**
     * add an special connection to this node (used for special kinds of graphs)
     * @method addConnection
     * @param {string} name
     * @param {string} type string defining the input type ("vec3","number",...)
     * @param {[x,y]} pos position of the connection inside the node
     * @param {string} direction if is input or output
     */
    addConnection(name: string, type: string, pos: Vector2, direction: string) {
        const o = {
            name: name,
            type: type,
            pos: pos,
            direction: direction,
            links: null,
        };
        this.connections.push(o);
        return o;
    }

    /**
     * computes the minimum size of a node according to its inputs and output slots
     * @method computeSize
     * @param {number} minHeight
     * @return {number} the total size
     */
    computeSize(out?: Float32Array) {
        if (this.constructor.size) {
            return this.constructor.size.concat();
        }

        let rows = Math.max(
            this.inputs ? this.inputs.length : 1,
            this.outputs ? this.outputs.length : 1
        );
        const size = out || new Float32Array([0, 0]);
        rows = Math.max(rows, 1);
        var font_size = LiteGraph.NODE_TEXT_SIZE; // although it should be graphcanvas.inner_text_font size

        var font_size = font_size;
        const title_width = compute_text_size(this.title);
        let input_width = 0;
        let output_width = 0;

        if (this.inputs) {
            for (var i = 0, l = this.inputs.length; i < l; ++i) {
                const input = this.inputs[i];
                var text = input.label || input.name || '';
                var text_width = compute_text_size(text);
                if (input_width < text_width) {
                    input_width = text_width;
                }
            }
        }

        if (this.outputs) {
            for (var i = 0, l = this.outputs.length; i < l; ++i) {
                const output = this.outputs[i];
                var text = output.label || output.name || '';
                var text_width = compute_text_size(text);
                if (output_width < text_width) {
                    output_width = text_width;
                }
            }
        }

        size[0] = Math.max(input_width + output_width + 10, title_width);
        size[0] = Math.max(size[0], LiteGraph.NODE_WIDTH);
        if (this.widgets && this.widgets.length) {
            size[0] = Math.max(size[0], LiteGraph.NODE_WIDTH * 1.5);
        }

        size[1] = (this.constructor.slot_start_y || 0) + rows * LiteGraph.NODE_SLOT_HEIGHT;

        let widgets_height = 0;
        if (this.widgets && this.widgets.length) {
            for (var i = 0, l = this.widgets.length; i < l; ++i) {
                if (this.widgets[i].computeSize)
                { widgets_height += this.widgets[i].computeSize(size[0])[1] + 4; }
                else
                { widgets_height += LiteGraph.NODE_WIDGET_HEIGHT + 4; }
            }
            widgets_height += 8;
        }

        // compute height using widgets height
        if (this.widgets_up)
        { size[1] = Math.max(size[1], widgets_height); }
        else if (this.widgets_start_y != null)
        { size[1] = Math.max(size[1], widgets_height + this.widgets_start_y); }
        else
        { size[1] += widgets_height; }

        function compute_text_size(text: string | any[]) {
            if (!text) {
                return 0;
            }
            return font_size * text.length * 0.6;
        }

        if (
            this.constructor.min_height &&
            size[1] < this.constructor.min_height
        ) {
            size[1] = this.constructor.min_height;
        }

        size[1] += 6; // margin

        return size;
    }

    /**
     * returns all the info available about a property of this node.
     *
     * @method getPropertyInfo
     * @param {String} property name of the property
     * @return {Object} the object with all the available info
    */
    getPropertyInfo(property: string)
    {
        let info = null;

        // there are several ways to define info about a property
        // legacy mode
        if (this.properties_info) {
            for (let i = 0; i < this.properties_info.length; ++i) {
                if (this.properties_info[i].name == property) {
                    info = this.properties_info[i];
                    break;
                }
            }
        }
        // litescene mode using the constructor
        if (this.constructor['@' + property])
        { info = this.constructor['@' + property]; }

        if (this.constructor.widgets_info && this.constructor.widgets_info[property])
        { info = this.constructor.widgets_info[property]; }

        // litescene mode using the constructor
        if (!info && this.onGetPropertyInfo) {
            info = this.onGetPropertyInfo(property);
        }

        if (!info)
        { info = {}; }
        if (!info.type)
        { info.type = typeof this.properties[property]; }
        if (info.widget == 'combo')
        { info.type = 'enum'; }

        return info;
    }

    /**
     * Defines a widget inside the node, it will be rendered on top of the node, you can control lots of properties
     *
     * @method addWidget
     * @param {String} type the widget type (could be "number","string","combo"
     * @param {String} name the text to show on the widget
     * @param {String} value the default value
     * @param {Function|String} callback function to call when it changes (optionally, it can be the name of the property to modify)
     * @param {Object} options the object that contains special properties of this widget 
     * @return {Object} the created widget object
     */
    addWidget(type: string, name: any, value: any, callback: { constructor: StringConstructor | ObjectConstructor | FunctionConstructor; } | null, options: { constructor?: any; property?: any; })
    {
        if (!this.widgets) {
            this.widgets = [];
        }

        if (!options && callback && callback.constructor === Object)
        {
            options = callback;
            callback = null;
        }

        if (options && options.constructor === String) // options can be the property name
        { options = { property: options }; }

        if (callback && callback.constructor === String) // callback can be the property name
        {
            if (!options)
            { options = {}; }
            options.property = callback;
            callback = null;
        }

        if (callback && callback.constructor !== Function)
        {
            console.warn('addWidget: callback must be a function');
            callback = null;
        }

        const w = {
            type: type.toLowerCase(),
            name: name,
            value: value,
            callback: callback,
            options: options || {},
        };

        if (w.options.y !== undefined) {
            w.y = w.options.y;
        }

        if (!callback && !w.options.callback && !w.options.property) {
            console.warn('LiteGraph addWidget(...) without a callback or property assigned');
        }
        if (type == 'combo' && !w.options.values) {
            throw 'LiteGraph addWidget(\'combo\',...) requires to pass values in options: { values:[\'red\',\'blue\'] }';
        }
        this.widgets.push(w);
        this.setSize(this.computeSize());
        return w;
    }

    addCustomWidget(custom_widget: any) {
        if (!this.widgets) {
            this.widgets = [];
        }
        this.widgets.push(custom_widget);
        return custom_widget;
    }

    /**
     * returns the bounding of the object, used for rendering purposes
     * bounding is: [topleft_cornerx, topleft_cornery, width, height]
     * @method getBounding
     * @return {Float32Array[4]} the total size
     */
    getBounding(out: number[] | Float32Array) {
        out = out || new Float32Array(4);
        out[0] = this.pos[0] - 4;
        out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
        out[2] = this.size[0] + 4;
        out[3] = this.size[1] + LiteGraph.NODE_TITLE_HEIGHT;

        if (this.onBounding) {
            this.onBounding(out);
        }
        return out;
    }

    /**
     * checks if a point is inside the shape of a node
     * @method isPointInside
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    isPointInside(x: number, y: number, margin?: number, skip_title?: any) {
        margin = margin || 0;

        let margin_top = this.graph && this.graph.isLive() ? 0 : LiteGraph.NODE_TITLE_HEIGHT;
        if (skip_title) {
            margin_top = 0;
        }
        if (this.flags && this.flags.collapsed) {
        // if ( distance([x,y], [this.pos[0] + this.size[0]*0.5, this.pos[1] + this.size[1]*0.5]) < LiteGraph.NODE_COLLAPSED_RADIUS)
            if (
                isInsideRectangle(
                    x,
                    y,
                    this.pos[0] - margin,
                    this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT - margin,
                    (this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH) +
                        2 * margin,
                    LiteGraph.NODE_TITLE_HEIGHT + 2 * margin
                )
            ) {
                return true;
            }
        } else if (
            this.pos[0] - 4 - margin < x &&
            this.pos[0] + this.size[0] + 4 + margin > x &&
            this.pos[1] - margin_top - margin < y &&
            this.pos[1] + this.size[1] + margin > y
        ) {
            return true;
        }
        return false;
    }

    /**
     * checks if a point is inside a node slot, and returns info about which slot
     * @method getSlotInPosition
     * @param {number} x
     * @param {number} y
     * @return {Object} if found the object contains { input|output: slot object, slot: number, link_pos: [x,y] }
     */
    getSlotInPosition(x: any, y: any) {
    // search for inputs
        const link_pos = new Float32Array(2);
        if (this.inputs) {
            for (var i = 0, l = this.inputs.length; i < l; ++i) {
                const input = this.inputs[i];
                this.getConnectionPos(true, i, link_pos);
                if (
                    isInsideRectangle(
                        x,
                        y,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        20,
                        10
                    )
                ) {
                    return { input: input, slot: i, link_pos: link_pos };
                }
            }
        }

        if (this.outputs) {
            for (var i = 0, l = this.outputs.length; i < l; ++i) {
                const output = this.outputs[i];
                this.getConnectionPos(false, i, link_pos);
                if (
                    isInsideRectangle(
                        x,
                        y,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        20,
                        10
                    )
                ) {
                    return { output: output, slot: i, link_pos: link_pos };
                }
            }
        }

        return null;
    }

    /**
     * returns the input slot with a given name (used for dynamic slots), -1 if not found
     * @method findInputSlot
     * @param {string} name the name of the slot
     * @return {number} the slot (-1 if not found)
     */
    findInputSlot(name: String) {
        if (!this.inputs) {
            return -1;
        }
        for (let i = 0, l = this.inputs.length; i < l; ++i) {
            if (name == this.inputs[i].name) {
                return i;
            }
        }
        return -1;
    }

    /**
     * returns the output slot with a given name (used for dynamic slots), -1 if not found
     * @method findOutputSlot
     * @param {string} name the name of the slot
     * @return {number} the slot (-1 if not found)
     */
    findOutputSlot(name: String) {
        if (!this.outputs) {
            return -1;
        }
        for (let i = 0, l = this.outputs.length; i < l; ++i) {
            if (name == this.outputs[i].name) {
                return i;
            }
        }
        return -1;
    }

    /**
     * connect this node output to the input of another node
     * @method connect
     * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
     * @param {LGraphNode} node the target node
     * @param {number_or_string} target_slot the input slot of the target node (could be the number of the slot or the string with the name of the slot, or -1 to connect a trigger)
     * @return {Object} the link_info is created, otherwise null
     */
    connect(slot: string | number, target_node: this, target_slot: string | number) {
        target_slot = target_slot || 0;

        if (!this.graph) {
        // could be connected before adding it to a graph
            console.log(
                'Connect: Error, node doesn\'t belong to any graph. Nodes must be added first to a graph before connecting them.'
            ); // due to link ids being associated with graphs
            return null;
        }

        // seek for the output slot
        if (slot.constructor === String) {
            slot = this.findOutputSlot(slot);
            if (slot == -1) {
                if (LiteGraph.debug) {
                    console.log('Connect: Error, no slot of name ' + slot);
                }
                return null;
            }
        } else if (!this.outputs || slot >= this.outputs.length) {
            if (LiteGraph.debug) {
                console.log('Connect: Error, slot number not found');
            }
            return null;
        }

        if (target_node && target_node.constructor === Number) {
            target_node = this.graph.getNodeById(target_node);
        }
        if (!target_node) {
            throw 'target node is null';
        }

        // avoid loopback
        if (target_node == this) {
            return null;
        }

        // you can specify the slot by name
        if (target_slot.constructor === String) {
            target_slot = target_node.findInputSlot(target_slot);
            if (target_slot == -1) {
                if (LiteGraph.debug) {
                    console.log(
                        'Connect: Error, no slot of name ' + target_slot
                    );
                }
                return null;
            }
        } else if (target_slot === LiteGraph.EVENT) {
        // search for first slot with event?
        /*
		//create input for trigger
		var input = target_node.addInput("onTrigger", LiteGraph.EVENT );
		target_slot = target_node.inputs.length - 1; //last one is the one created
		target_node.mode = LiteGraph.ON_TRIGGER;
		*/
            return null;
        } else if (
            !target_node.inputs ||
            target_slot >= target_node.inputs.length
        ) {
            if (LiteGraph.debug) {
                console.log('Connect: Error, slot number not found');
            }
            return null;
        }

        let changed = false;

        // if there is something already plugged there, disconnect
        if (target_node.inputs[target_slot].link != null) {
            this.graph.beforeChange();
            target_node.disconnectInput(target_slot);
            changed = true;
        }

        // why here??
        // this.setDirtyCanvas(false,true);
        // this.graph.connectionChange( this );

        const output = this.outputs[slot];

        // allows nodes to block connection
        if (target_node.onConnectInput) {
            if (target_node.onConnectInput(target_slot, output.type, output, this, slot) === false) {
                return null;
            }
        }

        const input = target_node.inputs[target_slot];
        let link_info = null;

        // this slots cannot be connected (different types)
        if (!LiteGraph.isValidConnection(output.type, input.type))
        {
	        this.setDirtyCanvas(false, true);
            if (changed)
		        { this.graph.connectionChange(this, link_info); }
            return null;
        }

        if (!changed)
        { this.graph.beforeChange(); }

        // create link class
        link_info = new LLink(
			++this.graph.last_link_id,
			input.type,
			this.id,
			slot,
			target_node.id,
			target_slot
        );

        // add to graph links list
        this.graph.links[link_info.id] = link_info;

        // connect in output
        if (output.links == null) {
            output.links = [];
        }
        output.links.push(link_info.id);
        // connect in input
        target_node.inputs[target_slot].link = link_info.id;
        if (this.graph) {
            this.graph._version++;
        }
        if (this.onConnectionsChange) {
            this.onConnectionsChange(
				LiteGraph.OUTPUT,
				slot,
				true,
				link_info,
				output
            );
        } // link_info has been created now, so its updated
        if (target_node.onConnectionsChange) {
            target_node.onConnectionsChange(
				LiteGraph.INPUT,
				target_slot,
				true,
				link_info,
				input
            );
        }
        if (this.graph && this.graph.onNodeConnectionChange) {
            this.graph.onNodeConnectionChange(
				LiteGraph.INPUT,
				target_node,
				target_slot,
				this,
				slot
            );
            this.graph.onNodeConnectionChange(
				LiteGraph.OUTPUT,
				this,
				slot,
				target_node,
				target_slot
            );
        }

        this.setDirtyCanvas(false, true);
        this.graph.afterChange();
        this.graph.connectionChange(this, link_info);

        return link_info;
    }

    /**
     * disconnect one output to an specific node
     * @method disconnectOutput
     * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
     * @param {LGraphNode} target_node the target node to which this slot is connected [Optional, if not target_node is specified all nodes will be disconnected]
     * @return {boolean} if it was disconnected successfully
     */
    disconnectOutput(slot: string | number, target_node?:LGraphNode) {
        if (typeof slot === 'string') {
            slot = this.findOutputSlot(slot);
            if (slot == -1) {
                if (LiteGraph.debug) {
                    console.log('Connect: Error, no slot of name ' + slot);
                }
                return false;
            }
        } else if (!this.outputs || slot >= this.outputs.length) {
            if (LiteGraph.debug) {
                console.log('Connect: Error, slot number not found');
            }
            return false;
        }

        // get output slot
        const output = this.outputs[slot];
        if (!output || !output.links || output.links.length == 0) {
            return false;
        }

        // one of the output links in this slot
        if (target_node) {
            if (target_node.constructor === Number) {
                target_node = this.graph.getNodeById(target_node);
            }
            if (!target_node) {
                throw 'Target Node not found';
            }

            for (var i = 0, l = output.links.length; i < l; i++) {
                var link_id = output.links[i];
                var link_info = this.graph.links[link_id];

                // is the link we are searching for...
                if (link_info.target_id == target_node.id) {
                    output.links.splice(i, 1); // remove here
                    var input = target_node.inputs[link_info.target_slot];
                    input.link = null; // remove there
                    delete this.graph.links[link_id]; // remove the link from the links pool
                    if (this.graph) {
                        this.graph._version++;
                    }
                    if (target_node.onConnectionsChange) {
                        target_node.onConnectionsChange(
                            LiteGraph.INPUT,
                            link_info.target_slot,
                            false,
                            link_info,
                            input
                        );
                    } // link_info hasn't been modified so its ok
                    if (this.onConnectionsChange) {
                        this.onConnectionsChange(
                            LiteGraph.OUTPUT,
                            slot,
                            false,
                            link_info,
                            output
                        );
                    }
                    if (this.graph && this.graph.onNodeConnectionChange) {
                        this.graph.onNodeConnectionChange(
                            LiteGraph.OUTPUT,
                            this,
                            slot
                        );
                    }
                    if (this.graph && this.graph.onNodeConnectionChange) {
                        this.graph.onNodeConnectionChange(
                            LiteGraph.OUTPUT,
                            this,
                            slot
                        );
                        this.graph.onNodeConnectionChange(
                            LiteGraph.INPUT,
                            target_node,
                            link_info.target_slot
                        );
                    }
                    break;
                }
            }
        } // all the links in this output slot
        else {
            for (var i = 0, l = output.links.length; i < l; i++) {
                var link_id = output.links[i];
                var link_info = this.graph.links[link_id];
                if (!link_info) {
                // bug: it happens sometimes
                    continue;
                }

                var target_node = this.graph.getNodeById(link_info.target_id);
                var input = null;
                if (this.graph) {
                    this.graph._version++;
                }
                if (target_node) {
                    input = target_node.inputs[link_info.target_slot];
                    input.link = null; // remove other side link
                    if (target_node.onConnectionsChange) {
                        target_node.onConnectionsChange(
                            LiteGraph.INPUT,
                            link_info.target_slot,
                            false,
                            link_info,
                            input
                        );
                    } // link_info hasn't been modified so its ok
                    if (this.graph && this.graph.onNodeConnectionChange) {
                        this.graph.onNodeConnectionChange(
                            LiteGraph.INPUT,
                            target_node,
                            link_info.target_slot
                        );
                    }
                }
                delete this.graph.links[link_id]; // remove the link from the links pool
                if (this.onConnectionsChange) {
                    this.onConnectionsChange(
                        LiteGraph.OUTPUT,
                        slot,
                        false,
                        link_info,
                        output
                    );
                }
                if (this.graph && this.graph.onNodeConnectionChange) {
                    this.graph.onNodeConnectionChange(
                        LiteGraph.OUTPUT,
                        this,
                        slot
                    );
                    this.graph.onNodeConnectionChange(
                        LiteGraph.INPUT,
                        target_node,
                        link_info.target_slot
                    );
                }
            }
            output.links = null;
        }

        this.setDirtyCanvas(false, true);
        this.graph.connectionChange(this);
        return true;
    }

    /**
     * disconnect one input
     * @method disconnectInput
     * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
     * @return {boolean} if it was disconnected successfully
     */
    disconnectInput(slot: string | number) {
    // seek for the output slot
        if (slot.constructor === String) {
            slot = this.findInputSlot(slot);
            if (slot == -1) {
                if (LiteGraph.debug) {
                    console.log('Connect: Error, no slot of name ' + slot);
                }
                return false;
            }
        } else if (!this.inputs || slot >= this.inputs.length) {
            if (LiteGraph.debug) {
                console.log('Connect: Error, slot number not found');
            }
            return false;
        }

        const input = this.inputs[slot];
        if (!input) {
            return false;
        }

        const link_id = this.inputs[slot].link;
        if (link_id != null)
        {
            this.inputs[slot].link = null;

            // remove other side
            const link_info = this.graph.links[link_id];
            if (link_info) {
                const target_node = this.graph.getNodeById(link_info.origin_id);
                if (!target_node) {
                    return false;
                }

                const output = target_node.outputs[link_info.origin_slot];
                if (!output || !output.links || output.links.length == 0) {
                    return false;
                }

                // search in the inputs list for this link
                for (var i = 0, l = output.links.length; i < l; i++) {
                    if (output.links[i] == link_id) {
                        output.links.splice(i, 1);
                        break;
                    }
                }

                delete this.graph.links[link_id]; // remove from the pool
                if (this.graph) {
                    this.graph._version++;
                }
                if (this.onConnectionsChange) {
                    this.onConnectionsChange(
						LiteGraph.INPUT,
						slot,
						false,
						link_info,
						input
                    );
                }
                if (target_node.onConnectionsChange) {
                    target_node.onConnectionsChange(
						LiteGraph.OUTPUT,
						i,
						false,
						link_info,
						output
                    );
                }
                if (this.graph && this.graph.onNodeConnectionChange) {
                    this.graph.onNodeConnectionChange(
						LiteGraph.OUTPUT,
						target_node,
						i
                    );
                    this.graph.onNodeConnectionChange(LiteGraph.INPUT, this, slot);
                }
            }
        } // link != null

        this.setDirtyCanvas(false, true);
        if (this.graph)
	        { this.graph.connectionChange(this); }
        return true;
    }

    /**
     * returns the center of a connection point in canvas coords
     * @method getConnectionPos
     * @param {boolean} is_input true if if a input slot, false if it is an output
     * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
     * @param {vec2} out [optional] a place to store the output, to free garbage
     * @return {[x,y]} the position
     **/
    getConnectionPos(
        is_input: boolean,
        slot_number: number,
        out: any[] | Float32Array
    ) {
        out = out || new Float32Array(2);
        let num_slots = 0;
        if (is_input && this.inputs) {
            num_slots = this.inputs.length;
        }
        if (!is_input && this.outputs) {
            num_slots = this.outputs.length;
        }

        const offset = LiteGraph.NODE_SLOT_HEIGHT * 0.5;

        if (this.flags.collapsed) {
            const w = this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH;
            if (this.horizontal) {
                out[0] = this.pos[0] + w * 0.5;
                if (is_input) {
                    out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
                } else {
                    out[1] = this.pos[1];
                }
            } else {
                if (is_input) {
                    out[0] = this.pos[0];
                } else {
                    out[0] = this.pos[0] + w;
                }
                out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT * 0.5;
            }
            return out;
        }

        // weird feature that never got finished
        if (is_input && slot_number == -1) {
            out[0] = this.pos[0] + LiteGraph.NODE_TITLE_HEIGHT * 0.5;
            out[1] = this.pos[1] + LiteGraph.NODE_TITLE_HEIGHT * 0.5;
            return out;
        }

        // hard-coded pos
        if (
            is_input &&
            num_slots > slot_number &&
            this.inputs[slot_number].pos
        ) {
            out[0] = this.pos[0] + this.inputs[slot_number].pos[0];
            out[1] = this.pos[1] + this.inputs[slot_number].pos[1];
            return out;
        } else if (
            !is_input &&
            num_slots > slot_number &&
            this.outputs[slot_number].pos
        ) {
            out[0] = this.pos[0] + this.outputs[slot_number].pos[0];
            out[1] = this.pos[1] + this.outputs[slot_number].pos[1];
            return out;
        }

        // horizontal distributed slots
        if (this.horizontal) {
            out[0] =
                this.pos[0] + (slot_number + 0.5) * (this.size[0] / num_slots);
            if (is_input) {
                out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
            } else {
                out[1] = this.pos[1] + this.size[1];
            }
            return out;
        }

        // default vertical slots
        if (is_input) {
            out[0] = this.pos[0] + offset;
        } else {
            out[0] = this.pos[0] + this.size[0] + 1 - offset;
        }
        out[1] =
            this.pos[1] +
            (slot_number + 0.7) * LiteGraph.NODE_SLOT_HEIGHT +
            (this.constructor.slot_start_y || 0);
        return out;
    }

    /* Force align to grid */
    alignToGrid() {
        this.pos[0] =
            LiteGraph.CANVAS_GRID_SIZE *
            Math.round(this.pos[0] / LiteGraph.CANVAS_GRID_SIZE);
        this.pos[1] =
            LiteGraph.CANVAS_GRID_SIZE *
            Math.round(this.pos[1] / LiteGraph.CANVAS_GRID_SIZE);
    }

    /* Console output */
    trace(msg: any) {
        if (!this.console) {
            this.console = [];
        }

        this.console.push(msg);
        if (this.console.length > LGraphNode.MAX_CONSOLE) {
            this.console.shift();
        }

        if (this.graph.onNodeTrace)
	        { this.graph.onNodeTrace(this, msg); }
    }

    /* Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
    setDirtyCanvas(
        dirty_foreground: boolean,
        dirty_background: boolean | undefined
    ) {
        if (!this.graph) {
            return;
        }
        this.graph.sendActionToCanvas('setDirty', [
            dirty_foreground,
            dirty_background,
        ]);
    }

    loadImage(url: string) {
        const img = new Image();
        img.src = LiteGraph.node_images_path + url;
        img.ready = false;

        const that = this;
        img.onload = function() {
            this.ready = true;
            that.setDirtyCanvas(true);
        };
        return img;
    }

    // safe LGraphNode action execution (not sure if safe)
    /*
executeAction(action)
{
	if(action == "") return false;

	if( action.indexOf(";") != -1 || action.indexOf("}") != -1)
	{
		this.trace("Error: Action contains unsafe characters");
		return false;
	}

	var tokens = action.split("(");
	var func_name = tokens[0];
	if( typeof(this[func_name]) != "function")
	{
		this.trace("Error: Action not found on node: " + func_name);
		return false;
	}

	var code = action;

	try
	{
		var _foo = eval;
		eval = null;
		(new Function("with(this) { " + code + "}")).call(this);
		eval = _foo;
	}
	catch (err)
	{
		this.trace("Error executing action {" + action + "} :" + err);
		return false;
	}

	return true;
}
*/

    /* Allows to get onMouseMove and onMouseUp events even if the mouse is out of focus */
    captureInput(v: any) {
        if (!this.graph || !this.graph.list_of_graphcanvas) {
            return;
        }

        const list = this.graph.list_of_graphcanvas;

        for (let i = 0; i < list.length; ++i) {
            const c = list[i];
            // releasing somebody elses capture?!
            if (!v && c.node_capturing_input != this) {
                continue;
            }

            // change
            c.node_capturing_input = v ? this : null;
        }
    }

    /**
     * Collapse the node to make it smaller on the canvas
     * @method collapse
     **/
    collapse(force: any) {
        if(this.graph){
            this.graph._version++;
        }
        if (this.constructor.collapsable === false && !force) {
            return;
        }
        if (!this.flags.collapsed) {
            this.flags.collapsed = true;
        } else {
            this.flags.collapsed = false;
        }
        this.setDirtyCanvas(true, true);
    }

    /**
     * Forces the node to do not move or realign on Z
     * @method pin
     **/

    pin(v: undefined) {
        this.graph._version++;
        if (v === undefined) {
            this.flags.pinned = !this.flags.pinned;
        } else {
            this.flags.pinned = v;
        }
    }

    localToScreen(x: any, y: any, graphcanvas: { scale: number; offset: number[]; }) {
        return [
            (x + this.pos[0]) * graphcanvas.scale + graphcanvas.offset[0],
            (y + this.pos[1]) * graphcanvas.scale + graphcanvas.offset[1],
        ];
    }
}


class LGraphGroup {
    graph: LGraph|null;
    title: any;
    font_size: number;
    color: string;
    _bounding: Float32Array;
    _pos: any;
    _size: any;
    _nodes: never[];
    font: any;
    flags: any;
    pos: any;
    _collapsed_width?: number;
    size: any;
    constructor(title: string) {
        this.title = title || 'Group';
        this.font_size = 24;
        this.color = LGraphCanvas.node_colors.pale_blue
            ? LGraphCanvas.node_colors.pale_blue.groupcolor
            : '#AAA';
        this._bounding = new Float32Array([10, 10, 140, 80]);
        this._pos = this._bounding.subarray(0, 2);
        this._size = this._bounding.subarray(2, 4);
        this._nodes = [];
        this.graph = null;

        Object.defineProperty(this, 'pos', {
            set: function(v) {
                if (!v || v.length < 2) {
                    return;
                }
                this._pos[0] = v[0];
                this._pos[1] = v[1];
            },
            get: function() {
                return this._pos;
            },
            enumerable: true,
        });

        Object.defineProperty(this, 'size', {
            set: function(v) {
                if (!v || v.length < 2) {
                    return;
                }
                this._size[0] = Math.max(140, v[0]);
                this._size[1] = Math.max(80, v[1]);
            },
            get: function() {
                return this._size;
            },
            enumerable: true,
        });
    }
    configure(o: { title: any; bounding: ArrayLike<number>; color: string; font: any; }) {
        this.title = o.title;
        this._bounding.set(o.bounding);
        this.color = o.color;
        this.font = o.font;
    }

    serialize() {
        const b = this._bounding;
        return {
            title: this.title,
            bounding: [
                Math.round(b[0]),
                Math.round(b[1]),
                Math.round(b[2]),
                Math.round(b[3]),
            ],
            color: this.color,
            font: this.font,
        };
    }

    move(deltax: any, deltay: any, ignore_nodes: any) {
        this._pos[0] += deltax;
        this._pos[1] += deltay;
        if (ignore_nodes) {
            return;
        }
        for (let i = 0; i < this._nodes.length; ++i) {
            const node = this._nodes[i];
            node.pos[0] += deltax;
            node.pos[1] += deltay;
        }
    }

    recomputeInsideNodes() {
        this._nodes.length = 0;
        const nodes = this.graph._nodes;
        const node_bounding = new Float32Array(4);

        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            node.getBounding(node_bounding);
            if (!overlapBounding(this._bounding, node_bounding)) {
                continue;
            } // out of the visible area
            this._nodes.push(node);
        }
    }
    /**
     * checks if a point is inside the shape of a node
     * @method isPointInside
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    isPointInside(x: any, y: any, margin: any, skip_title: any) {
        margin = margin || 0;

        let margin_top = this.graph && this.graph.isLive() ? 0 : LiteGraph.NODE_TITLE_HEIGHT;
        if (skip_title) {
            margin_top = 0;
        }
        if (this.flags && this.flags.collapsed) {
        // if ( distance([x,y], [this.pos[0] + this.size[0]*0.5, this.pos[1] + this.size[1]*0.5]) < LiteGraph.NODE_COLLAPSED_RADIUS)
            if (
                isInsideRectangle(
                    x,
                    y,
                    this.pos[0] - margin,
                    this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT - margin,
                    (this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH) +
                        2 * margin,
                    LiteGraph.NODE_TITLE_HEIGHT + 2 * margin
                )
            ) {
                return true;
            }
        } else if (
            this.pos[0] - 4 - margin < x &&
            this.pos[0] + this.size[0] + 4 + margin > x &&
            this.pos[1] - margin_top - margin < y &&
            this.pos[1] + this.size[1] + margin > y
        ) {
            return true;
        }
        return false;
    }

    /* Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
    setDirtyCanvas(dirty_foreground: any, dirty_background: any) {

        if (!this.graph) {
            return;
        }
        this.graph.sendActionToCanvas('setDirty', [
            dirty_foreground,
            dirty_background,
        ]);
    }
}


global.LGraphGroup = LiteGraph.LGraphGroup = LGraphGroup;

//****************************************

// Scale and Offset
class DragAndScale {
    offset: Float32Array;
    scale: number;
    max_scale: number;
    min_scale: number;
    onredraw: null;
    enabled: boolean;
    last_mouse: number[];
    element: null;
    visible_area: Float32Array;
    _binded_mouse_callback: (e: any) => false | undefined;
    dragging: any;
    onmouse: any;
    constructor(element?: null | undefined, skip_events?: boolean) {
        this.offset = new Float32Array([0, 0]);
        this.scale = 1;
        this.max_scale = 10;
        this.min_scale = 0.1;
        this.onredraw = null;
        this.enabled = true;
        this.last_mouse = [0, 0];
        this.element = null;
        this.visible_area = new Float32Array(4);

        if (element) {
            this.element = element;
            if (!skip_events) {
                this.bindEvents(element);
            }
        }
    }
    bindEvents(element: { addEventListener: (arg0: string, arg1: { (e: any): false | undefined; (e: any): false | undefined; (e: any): false | undefined; (e: any): false | undefined; }, arg2: boolean | undefined) => void; }) {
        this.last_mouse = new Float32Array(2);

        this._binded_mouse_callback = this.onMouse.bind(this);

        element.addEventListener('mousedown', this._binded_mouse_callback);
        element.addEventListener('mousemove', this._binded_mouse_callback);

        element.addEventListener(
            'mousewheel',
            this._binded_mouse_callback,
            false
        );
        element.addEventListener('wheel', this._binded_mouse_callback, false);
    }

    computeVisibleArea() {
        if (!this.element) {
            this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0;
            return;
        }
        const width = this.element.width;
        const height = this.element.height;
        const startx = -this.offset[0];
        const starty = -this.offset[1];
        const endx = startx + width / this.scale;
        const endy = starty + height / this.scale;
        this.visible_area[0] = startx;
        this.visible_area[1] = starty;
        this.visible_area[2] = endx - startx;
        this.visible_area[3] = endy - starty;
    }

    onMouse(e: { clientX: number; clientY: number; canvasx: number; canvasy: number; dragging: any; type: string; eventType: string; wheel: number; deltaY: number; wheelDeltaY: null; detail: number; delta: number; wheelDelta: number; preventDefault: () => void; stopPropagation: () => void; }) {
        if (!this.enabled) {
            return;
        }

        const canvas = this.element;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.canvasx = x;
        e.canvasy = y;
        e.dragging = this.dragging;

        let ignore = false;
        if (this.onmouse) {
            ignore = this.onmouse(e);
        }

        if (e.type == 'mousedown') {
            this.dragging = true;
            canvas.removeEventListener(
                'mousemove',
                this._binded_mouse_callback
            );
            document.body.addEventListener(
                'mousemove',
                this._binded_mouse_callback
            );
            document.body.addEventListener(
                'mouseup',
                this._binded_mouse_callback
            );
        } else if (e.type == 'mousemove') {
            if (!ignore) {
                const deltax = x - this.last_mouse[0];
                const deltay = y - this.last_mouse[1];
                if (this.dragging) {
                    this.mouseDrag(deltax, deltay);
                }
            }
        } else if (e.type == 'mouseup') {
            this.dragging = false;
            document.body.removeEventListener(
                'mousemove',
                this._binded_mouse_callback
            );
            document.body.removeEventListener(
                'mouseup',
                this._binded_mouse_callback
            );
            canvas.addEventListener('mousemove', this._binded_mouse_callback);
        } else if (
            e.type == 'mousewheel' ||
            e.type == 'wheel' ||
            e.type == 'DOMMouseScroll'
        ) {
            e.eventType = 'mousewheel';
            if (e.type == 'wheel') {
                e.wheel = -e.deltaY;
            } else {
                e.wheel =
                    e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60;
            }

            // from stack overflow
            e.delta = e.wheelDelta
                ? e.wheelDelta / 40
                : e.deltaY
                    ? -e.deltaY / 3
                    : 0;
            this.changeDeltaScale(1.0 + e.delta * 0.05);
        }

        this.last_mouse[0] = x;
        this.last_mouse[1] = y;

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    toCanvasContext(ctx: { scale: (arg0: number, arg1: number) => void; translate: (arg0: number, arg1: number) => void; }) {
        ctx.scale(this.scale, this.scale);
        ctx.translate(this.offset[0], this.offset[1]);
    }

    convertOffsetToCanvas(pos: number[]) {
    // return [pos[0] / this.scale - this.offset[0], pos[1] / this.scale - this.offset[1]];
        return [
            (pos[0] + this.offset[0]) * this.scale,
            (pos[1] + this.offset[1]) * this.scale,
        ];
    }

    convertCanvasToOffset(pos: number[], out: number[] | undefined) {
        out = out || [0, 0];
        out[0] = pos[0] / this.scale - this.offset[0];
        out[1] = pos[1] / this.scale - this.offset[1];
        return out;
    }

    mouseDrag(x: number, y: number) {
        this.offset[0] += x / this.scale;
        this.offset[1] += y / this.scale;

        if (this.onredraw) {
            this.onredraw(this);
        }
    }

    changeScale(value: number, zooming_center: any[]) {
        if (value < this.min_scale) {
            value = this.min_scale;
        } else if (value > this.max_scale) {
            value = this.max_scale;
        }

        if (value == this.scale) {
            return;
        }

        if (!this.element) {
            return;
        }

        const rect = this.element.getBoundingClientRect();
        if (!rect) {
            return;
        }

        zooming_center = zooming_center || [
            rect.width * 0.5,
            rect.height * 0.5,
        ];
        const center = this.convertCanvasToOffset(zooming_center);
        this.scale = value;
        if (Math.abs(this.scale - 1) < 0.01) {
            this.scale = 1;
        }

        const new_center = this.convertCanvasToOffset(zooming_center);
        const delta_offset = [
            new_center[0] - center[0],
            new_center[1] - center[1],
        ];

        this.offset[0] += delta_offset[0];
        this.offset[1] += delta_offset[1];

        if (this.onredraw) {
            this.onredraw(this);
        }
    }

    changeDeltaScale(value: number, zooming_center: undefined) {
        this.changeScale(this.scale * value, zooming_center);
    }

    reset() {
        this.scale = 1;
        this.offset[0] = 0;
        this.offset[1] = 0;
    }
}

LiteGraph.DragAndScale = DragAndScale;



//*********************************************************************************
// LGraphCanvas: LGraph renderer CLASS
//*********************************************************************************

/**
     * This class is in charge of rendering one graph inside a canvas. And provides all the interaction required.
     * Valid callbacks are: onNodeSelected, onNodeDeselected, onShowNodePanel, onNodeDblClicked
     *
     * @class LGraphCanvas
     * @constructor
     * @param {HTMLCanvas} canvas the canvas where you want to render (it accepts a selector in string format or the canvas element itself)
     * @param {LGraph} graph [optional]
     * @param {Object} options [optional] { skip_rendering, autoresize }
     */
class LGraphCanvas {
    graph?:LGraph|null;
    background_image: string;
    ds: DragAndScale;
    zoom_modify_alpha: boolean;
    title_text_font: string;
    inner_text_font: string;
    node_title_color: string;
    default_link_color: string;
    default_connection_color: { input_off: string; input_on: string; output_off: string; output_on: string; };
    highquality_render: boolean;
    use_gradients: boolean;
    editor_alpha: number;
    pause_rendering: boolean;
    clear_background: boolean;
    read_only: boolean;
    render_only_selected: boolean;
    live_mode: boolean;
    show_info: boolean;
    allow_dragcanvas: boolean;
    allow_dragnodes: boolean;
    allow_interaction: boolean;
    allow_searchbox: boolean;
    allow_reconnect_links: boolean;
    drag_mode: boolean;
    dragging_rectangle: null;
    filter: null;
    set_canvas_dirty_on_mouse_event: boolean;
    always_render_background: boolean;
    render_shadows: boolean;
    render_canvas_border: boolean;
    render_connections_shadows: boolean;
    render_connections_border: boolean;
    render_curved_connections: boolean;
    render_connection_arrows: boolean;
    render_collapsed_slots: boolean;
    render_execution_order: boolean;
    render_title_colored: boolean;
    render_link_tooltip: boolean;
    links_render_mode: number;
    mouse: number[];
    graph_mouse: number[];
    canvas_mouse: any;
    onSearchBox: null;
    onSearchBoxSelection: null;
    onMouse: null;
    onDrawBackground: null;
    onDrawForeground: null;
    onDrawOverlay: null;
    onDrawLinkTooltip: null;
    onNodeMoved: null;
    onSelectionChange: null;
    onConnectingChange: null;
    onBeforeChange: null;
    onAfterChange: null;
    connections_width: number;
    round_radius: number;
    current_node: null;
    node_widget: null;
    over_link_center: null;
    last_mouse_position: number[];
    visible_area: any;
    visible_links: never[];
    autoresize: any;
    frame: number;
    last_draw_time: number;
    render_time: number;
    fps: number;
    selected_nodes!: Record<number, LGraphNode>;;
    selected_group!: null | LGraphGroup;
    visible_nodes: never[];
    node_dragged: null;
    node_over: null;
    node_capturing_input: null;
    connecting_node: null;
    highlighted_links: {};
    dragging_canvas: boolean;
    dirty_canvas: boolean;
    dirty_bgcanvas: boolean;
    dirty_area: null;
    node_in_panel: null;
    last_mouse: number[];
    last_mouseclick: number;
    onClear: any;
    _graph_stack: any;
    canvas: any;
    bgcanvas: null;
    ctx: any;
    _mousemove_callback: (e: any) => false | undefined;
    _mouseup_callback: (e: any) => false | undefined;
    _events_binded: any;
    _mousedown_callback: (e: any) => false | undefined;
    _mousewheel_callback: (e: any) => false | undefined;
    _key_callback: (e: any) => false | undefined;
    _ondrop_callback: (e: any) => any;
    gl: any;
    bgctx: any;
    is_rendering: any;
    block_click: boolean;
    static active_canvas: this;
    last_click_position: any[];
    resizing_node: any;
    connecting_output: any;
    connecting_pos: any;
    connecting_slot: number;
    selected_group_resizing: boolean;
    last_mouse_dragging: boolean;
    onMouseDown: any;
    _highlight_input: number[];
    onDropItem: any;
    onShowNodePanel: any;
    onNodeDblClicked: any;
    onNodeSelected: any;
    onNodeDeselected: any;
    onRender: any;
    onRenderBackground: any;
    _bg_img: any;
    _pattern: null;
    _pattern_img: any;
    onBackgroundRender: any;
    prompt_box: null;
    search_box: null;
    getMenuOptions: any;
    getExtraMenuOptions: any;
    static active_node: any;
    constructor(canvas: string | Element | HTMLDialogElement | null, graph: LGraph, options: { skip_render?: any; autoresize?: any; } | undefined) {

        options = options || {};

        // if(graph === undefined)
        //	throw ("No graph assigned");
        this.background_image = LGraphCanvas.DEFAULT_BACKGROUND_IMAGE;

        if (canvas && canvas.constructor === String) {
            canvas = document.querySelector(canvas);
        }

        this.ds = new DragAndScale();
        this.zoom_modify_alpha = true; // otherwise it generates ugly patterns when scaling down too much

        this.title_text_font = '' + LiteGraph.NODE_TEXT_SIZE + 'px Arial';
        this.inner_text_font =
        'normal ' + LiteGraph.NODE_SUBTEXT_SIZE + 'px Arial';
        this.node_title_color = LiteGraph.NODE_TITLE_COLOR;
        this.default_link_color = LiteGraph.LINK_COLOR;
        this.default_connection_color = {
            input_off: '#778',
            input_on: '#7F7',
            output_off: '#778',
            output_on: '#7F7',
        };

        this.highquality_render = true;
        this.use_gradients = false; // set to true to render titlebar with gradients
        this.editor_alpha = 1; // used for transition
        this.pause_rendering = false;
        this.clear_background = true;

        this.read_only = false; // if set to true users cannot modify the graph
        this.render_only_selected = true;
        this.live_mode = false;
        this.show_info = true;
        this.allow_dragcanvas = true;
        this.allow_dragnodes = true;
        this.allow_interaction = true; // allow to control widgets, buttons, collapse, etc
        this.allow_searchbox = true;
        this.allow_reconnect_links = false; // allows to change a connection with having to redo it again

        this.drag_mode = false;
        this.dragging_rectangle = null;

        this.filter = null; // allows to filter to only accept some type of nodes in a graph

        this.set_canvas_dirty_on_mouse_event = true; // forces to redraw the canvas if the mouse does anything
        this.always_render_background = false;
        this.render_shadows = true;
        this.render_canvas_border = true;
        this.render_connections_shadows = false; // too much cpu
        this.render_connections_border = true;
        this.render_curved_connections = false;
        this.render_connection_arrows = false;
        this.render_collapsed_slots = true;
        this.render_execution_order = false;
        this.render_title_colored = true;
        this.render_link_tooltip = true;

        this.links_render_mode = LiteGraph.SPLINE_LINK;

        this.mouse = [0, 0]; // mouse in canvas coordinates, where 0,0 is the top-left corner of the blue rectangle
        this.graph_mouse = [0, 0]; // mouse in graph coordinates, where 0,0 is the top-left corner of the blue rectangle
        this.canvas_mouse = this.graph_mouse; // LEGACY: REMOVE THIS, USE GRAPH_MOUSE INSTEAD

        // to personalize the search box
        this.onSearchBox = null;
        this.onSearchBoxSelection = null;

        // callbacks
        this.onMouse = null;
        this.onDrawBackground = null; // to render background objects (behind nodes and connections) in the canvas affected by transform
        this.onDrawForeground = null; // to render foreground objects (above nodes and connections) in the canvas affected by transform
        this.onDrawOverlay = null; // to render foreground objects not affected by transform (for GUIs)
        this.onDrawLinkTooltip = null; // called when rendering a tooltip
        this.onNodeMoved = null; // called after moving a node
        this.onSelectionChange = null; // called if the selection changes
        this.onConnectingChange = null; // called before any link changes
        this.onBeforeChange = null; // called before modifying the graph
        this.onAfterChange = null; // called after modifying the graph

        this.connections_width = 3;
        this.round_radius = 8;

        this.current_node = null;
        this.node_widget = null; // used for widgets
        this.over_link_center = null;
        this.last_mouse_position = [0, 0];
        this.visible_area = this.ds.visible_area;
        this.visible_links = [];

        // link canvas and graph
        if (graph) {
            graph.attachCanvas(this);
        }

        this.setCanvas(canvas);
        this.clear();

        if (!options.skip_render) {
            this.startRendering();
        }

        this.autoresize = options.autoresize;
    }
    /**
     * clears all the data inside
     *
     * @method clear
     */
    clear() {
        this.frame = 0;
        this.last_draw_time = 0;
        this.render_time = 0;
        this.fps = 0;

        // this.scale = 1;
        // this.offset = [0,0];

        this.dragging_rectangle = null;

        this.selected_nodes = {};
        this.selected_group = null;

        this.visible_nodes = [];
        this.node_dragged = null;
        this.node_over = null;
        this.node_capturing_input = null;
        this.connecting_node = null;
        this.highlighted_links = {};

        this.dragging_canvas = false;

        this.dirty_canvas = true;
        this.dirty_bgcanvas = true;
        this.dirty_area = null;

        this.node_in_panel = null;
        this.node_widget = null;

        this.last_mouse = [0, 0];
        this.last_mouseclick = 0;
        this.visible_area.set([0, 0, 0, 0]);

        if (this.onClear) {
            this.onClear();
        }
    }

    /**
     * assigns a graph, you can reassign graphs to the same canvas
     *
     * @method setGraph
     * @param {LGraph} graph
     */
    setGraph(graph: boolean | null, skip_clear: undefined) {
        if (this.graph == graph) {
            return;
        }

        if (!skip_clear) {
            this.clear();
        }

        if (!graph && this.graph) {
            this.graph.detachCanvas(this);
            return;
        }

        graph.attachCanvas(this);

        // remove the graph stack in case a subgraph was open
        if (this._graph_stack)
        { this._graph_stack = null; }

        this.setDirty(true, true);
    }

    /**
     * returns the top level graph (in case there are subgraphs open on the canvas)
     *
     * @method getTopGraph
     * @return {LGraph} graph
     */
    getTopGraph()
    {
        if (this._graph_stack.length)
        { return this._graph_stack[0]; }
        return this.graph;
    }

    /**
     * opens a graph contained inside a node in the current graph
     *
     * @method openSubgraph
     * @param {LGraph} graph
     */
    openSubgraph(graph: boolean) {
        if (!graph) {
            throw 'graph cannot be null';
        }

        if (this.graph == graph) {
            throw 'graph cannot be the same';
        }

        this.clear();

        if (this.graph) {
            if (!this._graph_stack) {
                this._graph_stack = [];
            }
            this._graph_stack.push(this.graph);
        }

        graph.attachCanvas(this);
        this.checkPanels();
        this.setDirty(true, true);
    }

    /**
     * closes a subgraph contained inside a node
     *
     * @method closeSubgraph
     * @param {LGraph} assigns a graph
     */
    closeSubgraph() {
        if (!this._graph_stack || this._graph_stack.length == 0) {
            return;
        }
        const subgraph_node = this.graph._subgraph_node;
        const graph = this._graph_stack.pop();
        this.selected_nodes = {};
        this.highlighted_links = {};
        graph.attachCanvas(this);
        this.setDirty(true, true);
        if (subgraph_node) {
            this.centerOnNode(subgraph_node);
            this.selectNodes([subgraph_node]);
        }
    }

    /**
     * returns the visualy active graph (in case there are more in the stack)
     * @method getCurrentGraph
     * @return {LGraph} the active graph
     */
    getCurrentGraph() {
        return this.graph;
    }

    /**
     * assigns a canvas
     *
     * @method setCanvas
     * @param {Canvas} assigns a canvas (also accepts the ID of the element (not a selector)
     */
    setCanvas(canvas: string | HTMLElement | null, skip_events: undefined) {
        const that = this;

        if (canvas) {
            if (canvas.constructor === String) {
                canvas = document.getElementById(canvas);
                if (!canvas) {
                    throw 'Error creating LiteGraph canvas: Canvas not found';
                }
            }
        }

        if (canvas === this.canvas) {
            return;
        }

        if (!canvas && this.canvas) {
        // maybe detach events from old_canvas
            if (!skip_events) {
                this.unbindEvents();
            }
        }

        this.canvas = canvas;
        this.ds.element = canvas;

        if (!canvas) {
            return;
        }

        // this.canvas.tabindex = "1000";
        canvas.className += ' lgraphcanvas';
        canvas.data = this;
        canvas.tabindex = '1'; // to allow key events

        // bg canvas: used for non changing stuff
        this.bgcanvas = null;
        if (!this.bgcanvas) {
            this.bgcanvas = document.createElement('canvas');
            this.bgcanvas.width = this.canvas.width;
            this.bgcanvas.height = this.canvas.height;
        }

        if (canvas.getContext == null) {
            if (canvas.localName != 'canvas') {
                throw 'Element supplied for LGraphCanvas must be a <canvas> element, you passed a ' +
                    canvas.localName;
            }
            throw 'This browser doesn\'t support Canvas';
        }

        const ctx = (this.ctx = canvas.getContext('2d'));
        if (ctx == null) {
            if (!canvas.webgl_enabled) {
                console.warn(
                    'This canvas seems to be WebGL, enabling WebGL renderer'
                );
            }
            this.enableWebGL();
        }

        // input:  (move and up could be unbinded)
        this._mousemove_callback = this.processMouseMove.bind(this);
        this._mouseup_callback = this.processMouseUp.bind(this);

        if (!skip_events) {
            this.bindEvents();
        }
    }

    // used in some events to capture them
    _doNothing(e: { preventDefault: () => void; }) {
        e.preventDefault();
        return false;
    }
    _doReturnTrue(e: { preventDefault: () => void; }) {
        e.preventDefault();
        return true;
    }

    /**
     * binds mouse, keyboard, touch and drag events to the canvas
     * @method bindEvents
     **/
    bindEvents() {
        if (this._events_binded) {
            console.warn('LGraphCanvas: events already binded');
            return;
        }

        const canvas = this.canvas;

        const ref_window = this.getCanvasWindow();
        const document = ref_window.document; // hack used when moving canvas between windows

        this._mousedown_callback = this.processMouseDown.bind(this);
        this._mousewheel_callback = this.processMouseWheel.bind(this);

        canvas.addEventListener('mousedown', this._mousedown_callback, true); // down do not need to store the binded
        canvas.addEventListener('mousemove', this._mousemove_callback);
        canvas.addEventListener('mousewheel', this._mousewheel_callback, false);

        canvas.addEventListener('contextmenu', this._doNothing);
        canvas.addEventListener(
            'DOMMouseScroll',
            this._mousewheel_callback,
            false
        );

        // touch events
        // if( 'touchstart' in document.documentElement )
        {
            canvas.addEventListener('touchstart', this.touchHandler, true);
            canvas.addEventListener('touchmove', this.touchHandler, true);
            canvas.addEventListener('touchend', this.touchHandler, true);
            canvas.addEventListener('touchcancel', this.touchHandler, true);
        }

        // Keyboard ******************
        this._key_callback = this.processKey.bind(this);

        canvas.addEventListener('keydown', this._key_callback, true);
        document.addEventListener('keyup', this._key_callback, true); // in document, otherwise it doesn't fire keyup

        // Dropping Stuff over nodes ************************************
        this._ondrop_callback = this.processDrop.bind(this);

        canvas.addEventListener('dragover', this._doNothing, false);
        canvas.addEventListener('dragend', this._doNothing, false);
        canvas.addEventListener('drop', this._ondrop_callback, false);
        canvas.addEventListener('dragenter', this._doReturnTrue, false);

        this._events_binded = true;
    }

    /**
     * unbinds mouse events from the canvas
     * @method unbindEvents
     **/
    unbindEvents() {
        if (!this._events_binded) {
            console.warn('LGraphCanvas: no events binded');
            return;
        }

        const ref_window = this.getCanvasWindow();
        const document = ref_window.document;

        this.canvas.removeEventListener('mousedown', this._mousedown_callback);
        this.canvas.removeEventListener(
            'mousewheel',
            this._mousewheel_callback
        );
        this.canvas.removeEventListener(
            'DOMMouseScroll',
            this._mousewheel_callback
        );
        this.canvas.removeEventListener('keydown', this._key_callback);
        document.removeEventListener('keyup', this._key_callback);
        this.canvas.removeEventListener('contextmenu', this._doNothing);
        this.canvas.removeEventListener('drop', this._ondrop_callback);
        this.canvas.removeEventListener('dragenter', this._doReturnTrue);

        this.canvas.removeEventListener('touchstart', this.touchHandler);
        this.canvas.removeEventListener('touchmove', this.touchHandler);
        this.canvas.removeEventListener('touchend', this.touchHandler);
        this.canvas.removeEventListener('touchcancel', this.touchHandler);

        this._mousedown_callback = null;
        this._mousewheel_callback = null;
        this._key_callback = null;
        this._ondrop_callback = null;

        this._events_binded = false;
    }
    
/**
     * this function allows to render the canvas using WebGL instead of Canvas2D
     * this is useful if you plant to render 3D objects inside your nodes, it uses litegl.js for webgl and canvas2DtoWebGL to emulate the Canvas2D calls in webGL
     * @method enableWebGL
     **/
enableWebGL() {
    if (typeof GL === undefined) {
        throw 'litegl.js must be included to use a WebGL canvas';
    }
    if (typeof enableWebGLCanvas === undefined) {
        throw 'webglCanvas.js must be included to use this feature';
    }

    this.gl = this.ctx = enableWebGLCanvas(this.canvas);
    this.ctx.webgl = true;
    this.bgcanvas = this.canvas;
    this.bgctx = this.gl;
    this.canvas.webgl_enabled = true;

    /*
	GL.create({ canvas: this.bgcanvas });
	this.bgctx = enableWebGLCanvas( this.bgcanvas );
	window.gl = this.gl;
	*/
};

/**
     * marks as dirty the canvas, this way it will be rendered again
     *
     * @class LGraphCanvas
     * @method setDirty
     * @param {bool} fgcanvas if the foreground canvas is dirty (the one containing the nodes)
     * @param {bool} bgcanvas if the background canvas is dirty (the one containing the wires)
     */
setDirty(fgcanvas: boolean, bgcanvas: boolean | undefined) {
    if (fgcanvas) {
        this.dirty_canvas = true;
    }
    if (bgcanvas) {
        this.dirty_bgcanvas = true;
    }
};

/**
     * Used to attach the canvas in a popup
     *
     * @method getCanvasWindow
     * @return {window} returns the window where the canvas is attached (the DOM root node)
     */
getCanvasWindow() {
    if (!this.canvas) {
        return window;
    }
    const doc = this.canvas.ownerDocument;
    return doc.defaultView || doc.parentWindow;
};

/**
     * starts rendering the content of the canvas when needed
     *
     * @method startRendering
     */
startRendering() {
    if (this.is_rendering) {
        return;
    } // already rendering

    this.is_rendering = true;
    renderFrame.call(this);

    function renderFrame(this: any) {
        if (!this.pause_rendering) {
            this.draw();
        }

        const window = this.getCanvasWindow();
        if (this.is_rendering) {
            window.requestAnimationFrame(renderFrame.bind(this));
        }
    }
};

/**
     * stops rendering the content of the canvas (to save resources)
     *
     * @method stopRendering
     */
stopRendering() {
    this.is_rendering = false;
    /*
	if(this.rendering_timer_id)
	{
		clearInterval(this.rendering_timer_id);
		this.rendering_timer_id = null;
	}
	*/
};

/* LiteGraphCanvas input */

// used to block future mouse events (because of im gui)
blockClick()
{
    this.block_click = true;
    this.last_mouseclick = 0;
};

processMouseDown(e: MouseEvent) {

    if (this.set_canvas_dirty_on_mouse_event)
    { this.dirty_canvas = true; }

    if (!this.graph) {
        return;
    }

    this.adjustMouseEvent(e);

    const ref_window = this.getCanvasWindow();
    const document = ref_window.document;
    LGraphCanvas.active_canvas = this;
    var that = this;

    // move mouse move event to the window in case it drags outside of the canvas
    this.canvas.removeEventListener('mousemove', this._mousemove_callback);
    ref_window.document.addEventListener(
            'mousemove',
            this._mousemove_callback,
            true
    ); // catch for the entire window
    ref_window.document.addEventListener(
            'mouseup',
            this._mouseup_callback,
            true
    );

    const node = this.graph.getNodeOnPos(
            e.canvasX,
            e.canvasY,
            this.visible_nodes,
            5
    );
    const skip_dragging = false;
    let skip_action = false;
    const now = LiteGraph.getTime();
    const is_double_click = now - this.last_mouseclick < 300;
    this.mouse[0] = e.localX;
    this.mouse[1] = e.localY;
    this.graph_mouse[0] = e.canvasX;
    this.graph_mouse[1] = e.canvasY;
    this.last_click_position = [this.mouse[0], this.mouse[1]];

    this.canvas.focus();

    LiteGraph.closeAllContextMenus(ref_window);

    if (this.onMouse)
    {
        if (this.onMouse(e) == true)
        { return; }
    }

    // left button mouse
    if (e.which == 1)
    {
        if (e.ctrlKey)
        {
            this.dragging_rectangle = new Float32Array(4);
            this.dragging_rectangle[0] = e.canvasX;
            this.dragging_rectangle[1] = e.canvasY;
            this.dragging_rectangle[2] = 1;
            this.dragging_rectangle[3] = 1;
            skip_action = true;
        }

        let clicking_canvas_bg = false;

        // when clicked on top of a node
        // and it is not interactive
        if (node && this.allow_interaction && !skip_action && !this.read_only) {
            if (!this.live_mode && !node.flags.pinned) {
                this.bringToFront(node);
            } // if it wasn't selected?

            // not dragging mouse to connect two slots
            if (
                !this.connecting_node &&
                    !node.flags.collapsed &&
                    !this.live_mode
            ) {
                // Search for corner for resize
                if (
                    !skip_action &&
                        node.resizable !== false &&
                        isInsideRectangle(
                            e.canvasX,
                            e.canvasY,
                            node.pos[0] + node.size[0] - 5,
                            node.pos[1] + node.size[1] - 5,
                            10,
                            10
                        )
                ) {
                    this.graph.beforeChange();
                    this.resizing_node = node;
                    this.canvas.style.cursor = 'se-resize';
                    skip_action = true;
                } else {
                    // search for outputs
                    if (node.outputs) {
                        for (
                            var i = 0, l = node.outputs.length;
                            i < l;
                            ++i
                        ) {
                            const output = node.outputs[i];
                            var link_pos = node.getConnectionPos(false, i);
                            if (
                                isInsideRectangle(
                                        e.canvasX,
                                        e.canvasY,
                                        link_pos[0] - 15,
                                        link_pos[1] - 10,
                                        30,
                                        20
                                )
                            ) {
                                this.connecting_node = node;
                                this.connecting_output = output;
                                this.connecting_pos = node.getConnectionPos(false, i);
                                this.connecting_slot = i;

                                if (e.shiftKey) {
                                    node.disconnectOutput(i);
                                }

                                if (is_double_click) {
                                    if (node.onOutputDblClick) {
                                        node.onOutputDblClick(i, e);
                                    }
                                } else {
                                    if (node.onOutputClick) {
                                        node.onOutputClick(i, e);
                                    }
                                }

                                skip_action = true;
                                break;
                            }
                        }
                    }

                    // search for inputs
                    if (node.inputs) {
                        for (
                            var i = 0, l = node.inputs.length;
                            i < l;
                            ++i
                        ) {
                            const input = node.inputs[i];
                            var link_pos = node.getConnectionPos(true, i);
                            if (
                                isInsideRectangle(
                                        e.canvasX,
                                        e.canvasY,
                                        link_pos[0] - 15,
                                        link_pos[1] - 10,
                                        30,
                                        20
                                )
                            ) {
                                if (is_double_click) {
                                    if (node.onInputDblClick) {
                                        node.onInputDblClick(i, e);
                                    }
                                } else {
                                    if (node.onInputClick) {
                                        node.onInputClick(i, e);
                                    }
                                }

                                if (input.link !== null) {
                                    const link_info = this.graph.links[
                                        input.link
                                    ]; // before disconnecting
                                    node.disconnectInput(i);

                                    if (
                                        this.allow_reconnect_links ||
                                            e.shiftKey
                                    ) {
                                        this.connecting_node = this.graph._nodes_by_id[
                                            link_info.origin_id
                                        ];
                                        this.connecting_slot =
                                                link_info.origin_slot;
                                        this.connecting_output = this.connecting_node.outputs[
                                            this.connecting_slot
                                        ];
                                        this.connecting_pos = this.connecting_node.getConnectionPos(false, this.connecting_slot);
                                    }

                                    this.dirty_bgcanvas = true;
                                    skip_action = true;
                                }
                            }
                        }
                    }
                } // not resizing
            }

            // it wasn't clicked on the links boxes
            if (!skip_action) {
                let block_drag_node = false;
                const pos = [e.canvasX - node.pos[0], e.canvasY - node.pos[1]];

                // widgets
                const widget = this.processNodeWidgets(node, this.graph_mouse, e);
                if (widget) {
                    block_drag_node = true;
                    this.node_widget = [node, widget];
                }

                // double clicking
                if (is_double_click && this.selected_nodes[node.id]) {
                    // double click node
                    if (node.onDblClick) {
                        node.onDblClick(e, pos, this);
                    }
                    this.processNodeDblClicked(node);
                    block_drag_node = true;
                }

                // if do not capture mouse
                if (node.onMouseDown && node.onMouseDown(e, pos, this)) {
                    block_drag_node = true;
                } else {
                    // open subgraph button
                    if (node.subgraph && !node.skip_subgraph_button)
                    {
                        if (!node.flags.collapsed && pos[0] > node.size[0] - LiteGraph.NODE_TITLE_HEIGHT && pos[1] < 0) {
                            var that = this;
                            setTimeout(function() {
                                that.openSubgraph(node.subgraph);
                            }, 10);
                        }
                    }

                    if (this.live_mode) {
                        clicking_canvas_bg = true;
	                        block_drag_node = true;
                    }
                }

                if (!block_drag_node) {
                    if (this.allow_dragnodes) {
                        this.graph.beforeChange();
                        this.node_dragged = node;
                    }
                    if (!this.selected_nodes[node.id]) {
                        this.processNodeSelected(node, e);
                    }
                }

                this.dirty_canvas = true;
            }
        } // clicked outside of nodes
        else {
            // search for link connector
            if (!this.read_only)
            { for (var i = 0; i < this.visible_links.length; ++i) {
                const link = this.visible_links[i];
                const center = link._pos;
                if (
                    !center ||
							e.canvasX < center[0] - 4 ||
							e.canvasX > center[0] + 4 ||
							e.canvasY < center[1] - 4 ||
							e.canvasY > center[1] + 4
                ) {
                    continue;
                }
                // link clicked
                this.showLinkMenu(link, e);
                this.over_link_center = null; // clear tooltip
                break;
            } }

            this.selected_group = this.graph.getGroupOnPos(e.canvasX, e.canvasY);
            this.selected_group_resizing = false;
            if (this.selected_group && !this.read_only) {
                if (e.ctrlKey) {
                    this.dragging_rectangle = null;
                }

                const dist = distance([e.canvasX, e.canvasY], [this.selected_group.pos[0] + this.selected_group.size[0], this.selected_group.pos[1] + this.selected_group.size[1]]);
                if (dist * this.ds.scale < 10) {
                    this.selected_group_resizing = true;
                } else {
                    this.selected_group.recomputeInsideNodes();
                }
            }

            if (is_double_click && !this.read_only && this.allow_searchbox) {
                this.showSearchBox(e);
            }

            clicking_canvas_bg = true;
        }

        if (!skip_action && clicking_canvas_bg && this.allow_dragcanvas) {
            this.dragging_canvas = true;
        }
    } else if (e.which == 2) {
        // middle button
    } else if (e.which == 3) {
        // right button
        if (!this.read_only)
	            { this.processContextMenu(node, e); }
    }

    // TODO
    // if(this.node_selected != prev_selected)
    //	this.onNodeSelectionChange(this.node_selected);

    this.last_mouse[0] = e.localX;
    this.last_mouse[1] = e.localY;
    this.last_mouseclick = LiteGraph.getTime();
    this.last_mouse_dragging = true;

    /*
	if( (this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null)
		this.draw();
	*/

    this.graph.change();

    // this is to ensure to defocus(blur) if a text input element is on focus
    if (
        !ref_window.document.activeElement ||
            (ref_window.document.activeElement.nodeName.toLowerCase() !=
                'input' &&
                ref_window.document.activeElement.nodeName.toLowerCase() !=
                    'textarea')
    ) {
        e.preventDefault();
    }
    e.stopPropagation();

    if (this.onMouseDown) {
        this.onMouseDown(e);
    }

    return false;
};

/**
     * Called when a mouse move event has to be processed
     * @method processMouseMove
     **/
processMouseMove(e: { localX: any; localY: any; canvasX: number; canvasY: number; preventDefault: () => void; dragging: boolean; ctrlKey: any; }) {
    if (this.autoresize) {
        this.resize();
    }

    if (this.set_canvas_dirty_on_mouse_event)
    { this.dirty_canvas = true; }

    if (!this.graph) {
        return;
    }

    LGraphCanvas.active_canvas = this;
    this.adjustMouseEvent(e);
    const mouse = [e.localX, e.localY];
    this.mouse[0] = mouse[0];
    this.mouse[1] = mouse[1];
    const delta = [
        mouse[0] - this.last_mouse[0],
        mouse[1] - this.last_mouse[1],
    ];
    this.last_mouse = mouse;
    this.graph_mouse[0] = e.canvasX;
    this.graph_mouse[1] = e.canvasY;

    if (this.block_click)
    {
        e.preventDefault();
        return false;
    }

    e.dragging = this.last_mouse_dragging;

    if (this.node_widget) {
        this.processNodeWidgets(
                this.node_widget[0],
                this.graph_mouse,
                e,
                this.node_widget[1]
        );
        this.dirty_canvas = true;
    }

    if (this.dragging_rectangle)
    {
        this.dragging_rectangle[2] = e.canvasX - this.dragging_rectangle[0];
        this.dragging_rectangle[3] = e.canvasY - this.dragging_rectangle[1];
        this.dirty_canvas = true;
    }
    else if (this.selected_group && !this.read_only)
    {
        // moving/resizing a group
        if (this.selected_group_resizing) {
            this.selected_group.size = [
                e.canvasX - this.selected_group.pos[0],
                e.canvasY - this.selected_group.pos[1],
            ];
        } else {
            const deltax = delta[0] / this.ds.scale;
            const deltay = delta[1] / this.ds.scale;
            this.selected_group.move(deltax, deltay, e.ctrlKey);
            if (this.selected_group._nodes.length) {
                this.dirty_canvas = true;
            }
        }
        this.dirty_bgcanvas = true;
    } else if (this.dragging_canvas) {
        this.ds.offset[0] += delta[0] / this.ds.scale;
        this.ds.offset[1] += delta[1] / this.ds.scale;
        this.dirty_canvas = true;
        this.dirty_bgcanvas = true;
    } else if (this.allow_interaction && !this.read_only) {
        if (this.connecting_node) {
            this.dirty_canvas = true;
        }

        // get node over
        const node = this.graph.getNodeOnPos(e.canvasX, e.canvasY, this.visible_nodes);

        // remove mouseover flag
        for (var i = 0, l = this.graph._nodes.length; i < l; ++i) {
            if (this.graph._nodes[i].mouseOver && node != this.graph._nodes[i]) {
                // mouse leave
                this.graph._nodes[i].mouseOver = false;
                if (this.node_over && this.node_over.onMouseLeave) {
                    this.node_over.onMouseLeave(e);
                }
                this.node_over = null;
                this.dirty_canvas = true;
            }
        }

        // mouse over a node
        if (node) {

            if (node.redraw_on_mouse)
            { this.dirty_canvas = true; }

            // this.canvas.style.cursor = "move";
            if (!node.mouseOver) {
                // mouse enter
                node.mouseOver = true;
                this.node_over = node;
                this.dirty_canvas = true;

                if (node.onMouseEnter) {
                    node.onMouseEnter(e);
                }
            }

            // in case the node wants to do something
            if (node.onMouseMove) {
                node.onMouseMove(e, [e.canvasX - node.pos[0], e.canvasY - node.pos[1]], this);
            }

            // if dragging a link
            if (this.connecting_node) {
                const pos = this._highlight_input || [0, 0]; // to store the output of isOverNodeInput

                // on top of input
                if (this.isOverNodeBox(node, e.canvasX, e.canvasY)) {
                    // mouse on top of the corner box, don't know what to do
                } else {
                    // check if I have a slot below de mouse
                    const slot = this.isOverNodeInput(node, e.canvasX, e.canvasY, pos);
                    if (slot != -1 && node.inputs[slot]) {
                        const slot_type = node.inputs[slot].type;
                        if (LiteGraph.isValidConnection(this.connecting_output.type, slot_type)) {
                            this._highlight_input = pos;
                        }
                    } else {
                        this._highlight_input = null;
                    }
                }
            }

            // Search for corner
            if (this.canvas) {
                if (
                    isInsideRectangle(
                            e.canvasX,
                            e.canvasY,
                            node.pos[0] + node.size[0] - 5,
                            node.pos[1] + node.size[1] - 5,
                            5,
                            5
                    )
                ) {
                    this.canvas.style.cursor = 'se-resize';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
            }
        } else { // not over a node

            // search for link connector
            let over_link = null;
            for (var i = 0; i < this.visible_links.length; ++i) {
                const link = this.visible_links[i];
                const center = link._pos;
                if (
                    !center ||
						e.canvasX < center[0] - 4 ||
						e.canvasX > center[0] + 4 ||
						e.canvasY < center[1] - 4 ||
						e.canvasY > center[1] + 4
                ) {
                    continue;
                }
                over_link = link;
                break;
            }
            if (over_link != this.over_link_center)
            {
                this.over_link_center = over_link;
	                this.dirty_canvas = true;
            }

            if (this.canvas) {
	                this.canvas.style.cursor = '';
            }
        } // end

        // send event to node if capturing input (used with widgets that allow drag outside of the area of the node)
        if (this.node_capturing_input && this.node_capturing_input != node && this.node_capturing_input.onMouseMove) {
            this.node_capturing_input.onMouseMove(e, [e.canvasX - this.node_capturing_input.pos[0], e.canvasY - this.node_capturing_input.pos[1]], this);
        }

        // node being dragged
        if (this.node_dragged && !this.live_mode) {
            // console.log("draggin!",this.selected_nodes);
            for (var i in this.selected_nodes) {
                const n = this.selected_nodes[i];
                n.pos[0] += delta[0] / this.ds.scale;
                n.pos[1] += delta[1] / this.ds.scale;
            }

            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;
        }

        if (this.resizing_node && !this.live_mode) {
            // convert mouse to node space
            const desired_size = [e.canvasX - this.resizing_node.pos[0], e.canvasY - this.resizing_node.pos[1]];
            const min_size = this.resizing_node.computeSize();
            desired_size[0] = Math.max(min_size[0], desired_size[0]);
            desired_size[1] = Math.max(min_size[1], desired_size[1]);
            this.resizing_node.setSize(desired_size);

            this.canvas.style.cursor = 'se-resize';
            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;
        }
    }

    e.preventDefault();
    return false;
};

/**
     * Called when a mouse up event has to be processed
     * @method processMouseUp
     **/
processMouseUp(e: { click_time: number; which: number; ctrlKey: any; canvasX: number; canvasY: number; stopPropagation: () => void; preventDefault: () => void; }) {

    if (this.set_canvas_dirty_on_mouse_event)
    { this.dirty_canvas = true; }

    if (!this.graph)
    { return; }

    const window = this.getCanvasWindow();
    const document = window.document;
    LGraphCanvas.active_canvas = this;

    // restore the mousemove event back to the canvas
    document.removeEventListener('mousemove', this._mousemove_callback, true);
    this.canvas.addEventListener('mousemove', this._mousemove_callback, true);
    document.removeEventListener('mouseup', this._mouseup_callback, true);

    this.adjustMouseEvent(e);
    const now = LiteGraph.getTime();
    e.click_time = now - this.last_mouseclick;
    this.last_mouse_dragging = false;
    this.last_click_position = null;

    if (this.block_click)
    {
        console.log('foo');
        this.block_click = false; // used to avoid sending twice a click in a immediate button
    }

    if (e.which == 1) {

        if (this.node_widget)
        {
            this.processNodeWidgets(this.node_widget[0], this.graph_mouse, e);
        }

        // left button
        this.node_widget = null;

        if (this.selected_group) {
            const diffx =
                    this.selected_group.pos[0] -
                    Math.round(this.selected_group.pos[0]);
            const diffy =
                    this.selected_group.pos[1] -
                    Math.round(this.selected_group.pos[1]);
            this.selected_group.move(diffx, diffy, e.ctrlKey);
            this.selected_group.pos[0] = Math.round(
                    this.selected_group.pos[0]
            );
            this.selected_group.pos[1] = Math.round(
                    this.selected_group.pos[1]
            );
            if (this.selected_group._nodes.length) {
                this.dirty_canvas = true;
            }
            this.selected_group = null;
        }
        this.selected_group_resizing = false;

        if (this.dragging_rectangle) {
            if (this.graph) {
                const nodes = this.graph._nodes;
                const node_bounding = new Float32Array(4);
                this.deselectAllNodes();
                // compute bounding and flip if left to right
                const w = Math.abs(this.dragging_rectangle[2]);
                const h = Math.abs(this.dragging_rectangle[3]);
                const startx =
                        this.dragging_rectangle[2] < 0
                            ? this.dragging_rectangle[0] - w
                            : this.dragging_rectangle[0];
                const starty =
                        this.dragging_rectangle[3] < 0
                            ? this.dragging_rectangle[1] - h
                            : this.dragging_rectangle[1];
                this.dragging_rectangle[0] = startx;
                this.dragging_rectangle[1] = starty;
                this.dragging_rectangle[2] = w;
                this.dragging_rectangle[3] = h;

                // test against all nodes (not visible because the rectangle maybe start outside
                const to_select = [];
                for (let i = 0; i < nodes.length; ++i) {
                    var node = nodes[i];
                    node.getBounding(node_bounding);
                    if (
                        !overlapBounding(
                                this.dragging_rectangle,
                                node_bounding
                        )
                    ) {
                        continue;
                    } // out of the visible area
                    to_select.push(node);
                }
                if (to_select.length) {
                    this.selectNodes(to_select);
                }
            }
            this.dragging_rectangle = null;
        } else if (this.connecting_node) {
            // dragging a connection
            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;

            var node = this.graph.getNodeOnPos(
                    e.canvasX,
                    e.canvasY,
                    this.visible_nodes
            );

            // node below mouse
            if (node) {
                if (
                    this.connecting_output.type == LiteGraph.EVENT &&
                        this.isOverNodeBox(node, e.canvasX, e.canvasY)
                ) {
                    this.connecting_node.connect(
                            this.connecting_slot,
                            node,
                            LiteGraph.EVENT
                    );
                } else {
                    // slot below mouse? connect
                    const slot = this.isOverNodeInput(
                            node,
                            e.canvasX,
                            e.canvasY
                    );
                    if (slot != -1) {
                        this.connecting_node.connect(
                                this.connecting_slot,
                                node,
                                slot
                        );
                    } else {
                        // not on top of an input
                        const input = node.getInputInfo(0);
                        // auto connect
                        if (
                            this.connecting_output.type == LiteGraph.EVENT
                        ) {
                            this.connecting_node.connect(
                                    this.connecting_slot,
                                    node,
                                    LiteGraph.EVENT
                            );
                        } else if (
                            input &&
                                !input.link &&
                                LiteGraph.isValidConnection(
                                    input.type && this.connecting_output.type
                                )
                        ) {
                            this.connecting_node.connect(
                                    this.connecting_slot,
                                    node,
                                    0
                            );
                        }
                    }
                }
            }

            this.connecting_output = null;
            this.connecting_pos = null;
            this.connecting_node = null;
            this.connecting_slot = -1;
        } // not dragging connection
        else if (this.resizing_node) {
            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;
            this.graph.afterChange(this.resizing_node);
            this.resizing_node = null;
        } else if (this.node_dragged) {
            // node being dragged?
            var node = this.node_dragged;
            if (
                node &&
                    e.click_time < 300 &&
                    isInsideRectangle(e.canvasX, e.canvasY, node.pos[0], node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT, LiteGraph.NODE_TITLE_HEIGHT, LiteGraph.NODE_TITLE_HEIGHT)
            ) {
                node.collapse();
            }

            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;
            this.node_dragged.pos[0] = Math.round(this.node_dragged.pos[0]);
            this.node_dragged.pos[1] = Math.round(this.node_dragged.pos[1]);
            if (this.graph.config.align_to_grid) {
                this.node_dragged.alignToGrid();
            }
            if (this.onNodeMoved)
            { this.onNodeMoved(this.node_dragged); }
            this.graph.afterChange(this.node_dragged);
            this.node_dragged = null;
        } // no node being dragged
        else {
            // get node over
            var node = this.graph.getNodeOnPos(
                    e.canvasX,
                    e.canvasY,
                    this.visible_nodes
            );

            if (!node && e.click_time < 300) {
                this.deselectAllNodes();
            }

            this.dirty_canvas = true;
            this.dragging_canvas = false;

            if (this.node_over && this.node_over.onMouseUp) {
                this.node_over.onMouseUp(e, [e.canvasX - this.node_over.pos[0], e.canvasY - this.node_over.pos[1]], this);
            }
            if (
                this.node_capturing_input &&
                    this.node_capturing_input.onMouseUp
            ) {
                this.node_capturing_input.onMouseUp(e, [
                    e.canvasX - this.node_capturing_input.pos[0],
                    e.canvasY - this.node_capturing_input.pos[1],
                ]);
            }
        }
    } else if (e.which == 2) {
        // middle button
        // trace("middle");
        this.dirty_canvas = true;
        this.dragging_canvas = false;
    } else if (e.which == 3) {
        // right button
        // trace("right");
        this.dirty_canvas = true;
        this.dragging_canvas = false;
    }

    /*
	if((this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null)
		this.draw();
	*/

    this.graph.change();

    e.stopPropagation();
    e.preventDefault();
    return false;
};

/**
     * Called when a mouse wheel event has to be processed
     * @method processMouseWheel
     **/
processMouseWheel(e: WheelEvent&MouseEvent) {
    if (!this.graph || !this.allow_dragcanvas) {
        return;
    }

    const delta = e.deltaY != null ? e.deltaY : e.detail * -60;

    this.adjustMouseEvent(e);

    let scale = this.ds.scale;

    if (delta > 0) {
        scale *= 1.1;
    } else if (delta < 0) {
        scale *= 1 / 1.1;
    }

    // this.setZoom( scale, [ e.localX, e.localY ] );
    this.ds.changeScale(scale, [e.localX, e.localY]);

    this.graph.change();

    e.preventDefault();
    return false; // prevent default
};

/**
     * returns true if a position (in graph space) is on top of a node little corner box
     * @method isOverNodeBox
     **/
isOverNodeBox(node: { pos: number[]; }, canvasx: any, canvasy: any) {
    const title_height = LiteGraph.NODE_TITLE_HEIGHT;
    if (
        isInsideRectangle(
                canvasx,
                canvasy,
                node.pos[0] + 2,
                node.pos[1] + 2 - title_height,
                title_height - 4,
                title_height - 4
        )
    ) {
        return true;
    }
    return false;
};

/**
     * returns true if a position (in graph space) is on top of a node input slot
     * @method isOverNodeInput
     **/
isOverNodeInput(
    node: { inputs: string | any[]; getConnectionPos: (arg0: boolean, arg1: number) => any; horizontal: any; },
    canvasx: any,
    canvasy: any,
    slot_pos: any[] | undefined
) {
    if (node.inputs) {
        for (let i = 0, l = node.inputs.length; i < l; ++i) {
            const input = node.inputs[i];
            const link_pos = node.getConnectionPos(true, i);
            let is_inside = false;
            if (node.horizontal) {
                is_inside = isInsideRectangle(
                        canvasx,
                        canvasy,
                        link_pos[0] - 5,
                        link_pos[1] - 10,
                        10,
                        20
                );
            } else {
                is_inside = isInsideRectangle(
                        canvasx,
                        canvasy,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        40,
                        10
                );
            }
            if (is_inside) {
                if (slot_pos) {
                    slot_pos[0] = link_pos[0];
                    slot_pos[1] = link_pos[1];
                }
                return i;
            }
        }
    }
    return -1;
};

/**
     * process a key event
     * @method processKey
     **/
processKey(e: { target: { localName: string; }; type: string; keyCode: number; ctrlKey: any; code: string; metaKey: any; shiftKey: any; preventDefault: () => void; stopImmediatePropagation: () => void; }) {
    if (!this.graph) {
        return;
    }

    let block_default = false;
    // console.log(e); //debug

    if (e.target.localName == 'input') {
        return;
    }

    if (e.type == 'keydown') {
        if (e.keyCode == 32) {
            // esc
            this.dragging_canvas = true;
            block_default = true;
        }

        // select all Control A
        if (e.keyCode == 65 && e.ctrlKey) {
            this.selectNodes();
            block_default = true;
        }

        if (e.code == 'KeyC' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            // copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        if (e.code == 'KeyV' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            // paste
            this.pasteFromClipboard();
        }

        // delete or backspace
        if (e.keyCode == 46 || e.keyCode == 8) {
            if (
                e.target.localName != 'input' &&
                    e.target.localName != 'textarea'
            ) {
                this.deleteSelectedNodes();
                block_default = true;
            }
        }

        // collapse
        // ...

        // TODO
        if (this.selected_nodes) {
            for (var i in this.selected_nodes) {
                if (this.selected_nodes[i].onKeyDown) {
                    this.selected_nodes[i].onKeyDown(e);
                }
            }
        }
    } else if (e.type == 'keyup') {
        if (e.keyCode == 32) {
            this.dragging_canvas = false;
        }

        if (this.selected_nodes) {
            for (var i in this.selected_nodes) {
                if (this.selected_nodes[i].onKeyUp) {
                    this.selected_nodes[i].onKeyUp(e);
                }
            }
        }
    }

    this.graph.change();

    if (block_default) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }
};

copyToClipboard() {
    const clipboard_info = {
        nodes: [],
        links: [],
    };
    let index = 0;
    const selected_nodes_array = [];
    for (var i in this.selected_nodes) {
        var node = this.selected_nodes[i];
        node._relative_id = index;
        selected_nodes_array.push(node);
        index += 1;
    }

    for (var i = 0; i < selected_nodes_array.length; ++i) {
        var node = selected_nodes_array[i];
        const cloned = node.clone();
        if (!cloned)
        {
            console.warn('node type not found: ' + node.type);
            continue;
        }
        clipboard_info.nodes.push(cloned.serialize());
        if (node.inputs && node.inputs.length) {
            for (let j = 0; j < node.inputs.length; ++j) {
                const input = node.inputs[j];
                if (!input || input.link == null) {
                    continue;
                }
                const link_info = this.graph.links[input.link];
                if (!link_info) {
                    continue;
                }
                const target_node = this.graph.getNodeById(
                        link_info.origin_id
                );
                if (!target_node || !this.selected_nodes[target_node.id]) {
                    // improve this by allowing connections to non-selected nodes
                    continue;
                } // not selected
                clipboard_info.links.push([
                    target_node._relative_id,
                    link_info.origin_slot, // j,
                    node._relative_id,
                    link_info.target_slot,
                ]);
            }
        }
    }
    localStorage.setItem(
            'litegrapheditor_clipboard',
            JSON.stringify(clipboard_info)
    );
};

pasteFromClipboard() {
    const data = localStorage.getItem('litegrapheditor_clipboard');
    if (!data) {
        return;
    }

    this.graph.beforeChange();

    // create nodes
    const clipboard_info = JSON.parse(data);
    const nodes = [];
    for (var i = 0; i < clipboard_info.nodes.length; ++i) {
        const node_data = clipboard_info.nodes[i];
        const node = LiteGraph.createNode(node_data.type);
        if (node) {
            node.configure(node_data);
            node.pos[0] += 5;
            node.pos[1] += 5;
            this.graph.add(node);
            nodes.push(node);
        }
    }

    // create links
    for (var i = 0; i < clipboard_info.links.length; ++i) {
        const link_info = clipboard_info.links[i];
        const origin_node = nodes[link_info[0]];
        const target_node = nodes[link_info[2]];
        if (origin_node && target_node)
	            { origin_node.connect(link_info[1], target_node, link_info[3]); }
        else
        { console.warn('Warning, nodes missing on pasting'); }
    }

    this.selectNodes(nodes);

    this.graph.afterChange();
};

/**
     * process a item drop event on top the canvas
     * @method processDrop
     **/
processDrop(e: { preventDefault: () => void; canvasX: any; canvasY: any; dataTransfer: { files: any[]; }; }) {
    e.preventDefault();
    this.adjustMouseEvent(e);

    const pos = [e.canvasX, e.canvasY];
    const node = this.graph ? this.graph.getNodeOnPos(pos[0], pos[1]) : null;

    if (!node) {
        let r = null;
        if (this.onDropItem) {
            r = this.onDropItem(event);
        }
        if (!r) {
            this.checkDropItem(e);
        }
        return;
    }

    if (node.onDropFile || node.onDropData) {
        const files = e.dataTransfer.files;
        if (files && files.length) {
            for (let i = 0; i < files.length; i++) {
                var file = e.dataTransfer.files[0];
                var filename = file.name;
                const ext = LGraphCanvas.getFileExtension(filename);
                // console.log(file);

                if (node.onDropFile) {
                    node.onDropFile(file);
                }

                if (node.onDropData) {
                    // prepare reader
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        // console.log(event.target);
                        const data = event.target.result;
                        node.onDropData(data, filename, file);
                    };

                    // read data
                    const type = file.type.split('/')[0];
                    if (type == 'text' || type == '') {
                        reader.readAsText(file);
                    } else if (type == 'image') {
                        reader.readAsDataURL(file);
                    } else {
                        reader.readAsArrayBuffer(file);
                    }
                }
            }
        }
    }

    if (node.onDropItem) {
        if (node.onDropItem(event)) {
            return true;
        }
    }

    if (this.onDropItem) {
        return this.onDropItem(event);
    }

    return false;
};

// called if the graph doesn't have a default drop item behaviour
checkDropItem(e: { dataTransfer: { files: string | any[]; }; canvasX: any; canvasY: any; }) {
    if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        const ext = LGraphCanvas.getFileExtension(file.name).toLowerCase();
        const nodetype = LiteGraph.node_types_by_file_extension[ext];
        if (nodetype) {
            this.graph.beforeChange();
            const node = LiteGraph.createNode(nodetype.type);
            node.pos = [e.canvasX, e.canvasY];
            this.graph.add(node);
            if (node.onDropFile) {
                node.onDropFile(file);
            }
            this.graph.afterChange();
        }
    }
};

processNodeDblClicked(n: any) {
    if (this.onShowNodePanel) {
        this.onShowNodePanel(n);
    }
    else
    {
        this.showShowNodePanel(n);
    }

    if (this.onNodeDblClicked) {
        this.onNodeDblClicked(n);
    }

    this.setDirty(true);
};

processNodeSelected(node: any, e: { shiftKey: any; }) {
    this.selectNode(node, e && e.shiftKey);
    if (this.onNodeSelected) {
        this.onNodeSelected(node);
    }
};

/**
     * selects a given node (or adds it to the current selection)
     * @method selectNode
     **/
selectNode(
    node: null,
    add_to_current_selection: any
) {
    if (node == null) {
        this.deselectAllNodes();
    } else {
        this.selectNodes([node], add_to_current_selection);
    }
};

/**
     * selects several nodes (or adds them to the current selection)
     * @method selectNodes
     **/
selectNodes(nodes: string | any[] | undefined, add_to_current_selection: undefined)
{
    if (!add_to_current_selection) {
        this.deselectAllNodes();
    }

    nodes = nodes || this.graph._nodes;
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        if (node.is_selected) {
            continue;
        }

        if (!node.is_selected && node.onSelected) {
            node.onSelected();
        }
        node.is_selected = true;
        this.selected_nodes[node.id] = node;

        if (node.inputs) {
            for (var j = 0; j < node.inputs.length; ++j) {
                this.highlighted_links[node.inputs[j].link] = true;
            }
        }
        if (node.outputs) {
            for (var j = 0; j < node.outputs.length; ++j) {
                const out = node.outputs[j];
                if (out.links) {
                    for (let k = 0; k < out.links.length; ++k) {
                        this.highlighted_links[out.links[k]] = true;
                    }
                }
            }
        }
    }

    if (this.onSelectionChange)
    { this.onSelectionChange(this.selected_nodes); }

    this.setDirty(true);
};

/**
     * removes a node from the current selection
     * @method deselectNode
     **/
deselectNode(node: { is_selected: boolean; onDeselected: () => void; inputs: string | any[]; outputs: string | any[]; }) {
    if (!node.is_selected) {
        return;
    }
    if (node.onDeselected) {
        node.onDeselected();
    }
    node.is_selected = false;

    if (this.onNodeDeselected) {
        this.onNodeDeselected(node);
    }

    // remove highlighted
    if (node.inputs) {
        for (var i = 0; i < node.inputs.length; ++i) {
            delete this.highlighted_links[node.inputs[i].link];
        }
    }
    if (node.outputs) {
        for (var i = 0; i < node.outputs.length; ++i) {
            const out = node.outputs[i];
            if (out.links) {
                for (let j = 0; j < out.links.length; ++j) {
                    delete this.highlighted_links[out.links[j]];
                }
            }
        }
    }
};

/**
     * removes all nodes from the current selection
     * @method deselectAllNodes
     **/
deselectAllNodes() {
    if (!this.graph) {
        return;
    }
    const nodes = this.graph._nodes;
    for (let i = 0, l = nodes.length; i < l; ++i) {
        const node = nodes[i];
        if (!node.is_selected) {
            continue;
        }
        if (node.onDeselected) {
            node.onDeselected();
        }
        node.is_selected = false;
        if (this.onNodeDeselected) {
            this.onNodeDeselected(node);
        }
    }
    this.selected_nodes = {};
    this.current_node = null;
    this.highlighted_links = {};
    if (this.onSelectionChange)
    { this.onSelectionChange(this.selected_nodes); }
    this.setDirty(true);
};

/**
     * deletes all nodes in the current selection from the graph
     * @method deleteSelectedNodes
     **/
deleteSelectedNodes() {

    this.graph.beforeChange();

    for (const i in this.selected_nodes) {
        const node = this.selected_nodes[i];

        if (node.block_delete)
        { continue; }

        // autoconnect when possible (very basic, only takes into account first input-output)
        if (node.inputs && node.inputs.length && node.outputs && node.outputs.length && LiteGraph.isValidConnection(node.inputs[0].type, node.outputs[0].type) && node.inputs[0].link && node.outputs[0].links && node.outputs[0].links.length)
        {
            const input_link = node.graph.links[ node.inputs[0].link ];
            const output_link = node.graph.links[ node.outputs[0].links[0] ];
            const input_node = node.getInputNode(0);
            const output_node = node.getOutputNodes(0)[0];
            if (input_node && output_node)
            { input_node.connect(input_link.origin_slot, output_node, output_link.target_slot); }
        }
        this.graph.remove(node);
        if (this.onNodeDeselected) {
            this.onNodeDeselected(node);
        }
    }
    this.selected_nodes = {};
    this.current_node = null;
    this.highlighted_links = {};
    this.setDirty(true);
    this.graph.afterChange();
};

/**
     * centers the camera on a given node
     * @method centerOnNode
     **/
centerOnNode(node: { pos: number[]; size: number[]; }) {
    this.ds.offset[0] =
            -node.pos[0] -
            node.size[0] * 0.5 +
            (this.canvas.width * 0.5) / this.ds.scale;
    this.ds.offset[1] =
            -node.pos[1] -
            node.size[1] * 0.5 +
            (this.canvas.height * 0.5) / this.ds.scale;
    this.setDirty(true, true);
};

/**
     * adds some useful properties to a mouse event, like the position in graph coordinates
     * @method adjustMouseEvent
     **/
adjustMouseEvent(e: MouseEvent&WheelEvent&any) {
            Object.defineProperty(e,'localX',{
            value:e.localX,
            writable:true,
            configurable:true,
            enumerable:true
        })
        Object.defineProperty(e,'localY',{
            value:e.localY,
            writable:true,
            configurable:true,
            enumerable:true
        })
        Object.defineProperty(e,'deltaX',{
            value:e.deltaX,
            writable:true,
            configurable:true,
            enumerable:true
        })
        Object.defineProperty(e,'deltaY',{
            value:e.deltaY,
            writable:true,
            configurable:true,
            enumerable:true
        })
    if (this.canvas) {
        const b = this.canvas.getBoundingClientRect();
        e.localX = e.clientX - b.left;
        e.localY = e.clientY - b.top;
    } else {
        e.localX = e.clientX;
        e.localY = e.clientY;
    }

    e.deltaX = e.localX - this.last_mouse_position[0];
    e.deltaY = e.localY - this.last_mouse_position[1];

    this.last_mouse_position[0] = e.localX;
    this.last_mouse_position[1] = e.localY;

    e.canvasX = e.localX / this.ds.scale - this.ds.offset[0];
    e.canvasY = e.localY / this.ds.scale - this.ds.offset[1];
};

/**
     * changes the zoom level of the graph (default is 1), you can pass also a place used to pivot the zoom
     * @method setZoom
     **/
setZoom(value: any, zooming_center: any) {
    this.ds.changeScale(value, zooming_center);
    /*
	if(!zooming_center && this.canvas)
		zooming_center = [this.canvas.width * 0.5,this.canvas.height * 0.5];

	var center = this.convertOffsetToCanvas( zooming_center );

	this.ds.scale = value;

	if(this.scale > this.max_zoom)
		this.scale = this.max_zoom;
	else if(this.scale < this.min_zoom)
		this.scale = this.min_zoom;

	var new_center = this.convertOffsetToCanvas( zooming_center );
	var delta_offset = [new_center[0] - center[0], new_center[1] - center[1]];

	this.offset[0] += delta_offset[0];
	this.offset[1] += delta_offset[1];
	*/

    this.dirty_canvas = true;
    this.dirty_bgcanvas = true;
};

/**
     * converts a coordinate from graph coordinates to canvas2D coordinates
     * @method convertOffsetToCanvas
     **/
convertOffsetToCanvas(pos: any, out: any) {
    return this.ds.convertOffsetToCanvas(pos, out);
};

/**
     * converts a coordinate from Canvas2D coordinates to graph space
     * @method convertCanvasToOffset
     **/
convertCanvasToOffset(pos: number[], out: undefined) {
    return this.ds.convertCanvasToOffset(pos, out);
};

// converts event coordinates from canvas2D to graph coordinates
convertEventToCanvasOffset(e: { clientX: number; clientY: number; }) {
    const rect = this.canvas.getBoundingClientRect();
    return this.convertCanvasToOffset([
        e.clientX - rect.left,
        e.clientY - rect.top,
    ]);
};

/**
     * brings a node to front (above all other nodes)
     * @method bringToFront
     **/
bringToFront(node: any) {
    const i = this.graph._nodes.indexOf(node);
    if (i == -1) {
        return;
    }

    this.graph._nodes.splice(i, 1);
    this.graph._nodes.push(node);
};

/**
     * sends a node to the back (below all other nodes)
     * @method sendToBack
     **/
sendToBack(node: any) {
    const i = this.graph._nodes.indexOf(node);
    if (i == -1) {
        return;
    }

    this.graph._nodes.splice(i, 1);
    this.graph._nodes.unshift(node);
};

/**
     * checks which nodes are visible (inside the camera area)
     * @method computeVisibleNodes
     **/
computeVisibleNodes(nodes: string | any[] | null, out: never[]) {
    const visible_nodes = out || [];
    visible_nodes.length = 0;
    nodes = nodes || this.graph._nodes;
    for (let i = 0, l = nodes.length; i < l; ++i) {
        const n = nodes[i];

        // skip rendering nodes in live mode
        if (this.live_mode && !n.onDrawBackground && !n.onDrawForeground) {
            continue;
        }

        if (!overlapBounding(this.visible_area, n.getBounding(temp))) {
            continue;
        } // out of the visible area

        visible_nodes.push(n);
    }
    return visible_nodes;
};

/**
     * renders the whole canvas content, by rendering in two separated canvas, one containing the background grid and the connections, and one containing the nodes)
     * @method draw
     **/
draw(force_canvas: boolean, force_bgcanvas: boolean | undefined) {
    if (!this.canvas || this.canvas.width == 0 || this.canvas.height == 0) {
        return;
    }

    // fps counting
    const now = LiteGraph.getTime();
    this.render_time = (now - this.last_draw_time) * 0.001;
    this.last_draw_time = now;

    if (this.graph) {
        this.ds.computeVisibleArea();
    }

    if (
        this.dirty_bgcanvas ||
            force_bgcanvas ||
            this.always_render_background ||
            (this.graph &&
                this.graph._last_trigger_time &&
                now - this.graph._last_trigger_time < 1000)
    ) {
        this.drawBackCanvas();
    }

    if (this.dirty_canvas || force_canvas) {
        this.drawFrontCanvas();
    }

    this.fps = this.render_time ? 1.0 / this.render_time : 0;
    this.frame += 1;
};

/**
     * draws the front canvas (the one containing all the nodes)
     * @method drawFrontCanvas
     **/
drawFrontCanvas() {
    this.dirty_canvas = false;

    if (!this.ctx) {
        this.ctx = this.bgcanvas.getContext('2d');
    }
    const ctx = this.ctx;
    if (!ctx) {
        // maybe is using webgl...
        return;
    }

    if (ctx.start2D) {
        ctx.start2D();
    }

    const canvas = this.canvas;

    // reset in case of error
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // clip dirty area if there is one, otherwise work in full canvas
    if (this.dirty_area) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(
                this.dirty_area[0],
                this.dirty_area[1],
                this.dirty_area[2],
                this.dirty_area[3]
        );
        ctx.clip();
    }

    // clear
    // canvas.width = canvas.width;
    if (this.clear_background) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // draw bg canvas
    if (this.bgcanvas == this.canvas) {
        this.drawBackCanvas();
    } else {
        ctx.drawImage(this.bgcanvas, 0, 0);
    }

    // rendering
    if (this.onRender) {
        this.onRender(canvas, ctx);
    }

    // info widget
    if (this.show_info) {
        this.renderInfo(ctx);
    }

    if (this.graph) {
        // apply transformations
        ctx.save();
        this.ds.toCanvasContext(ctx);

        // draw nodes
        let drawn_nodes = 0;
        const visible_nodes = this.computeVisibleNodes(
                null,
                this.visible_nodes
        );

        for (let i = 0; i < visible_nodes.length; ++i) {
            const node = visible_nodes[i];

            // transform coords system
            ctx.save();
            ctx.translate(node.pos[0], node.pos[1]);

            // Draw
            this.drawNode(node, ctx);
            drawn_nodes += 1;

            // Restore
            ctx.restore();
        }

        // on top (debug)
        if (this.render_execution_order) {
            this.drawExecutionOrder(ctx);
        }

        // connections ontop?
        if (this.graph.config.links_ontop) {
            if (!this.live_mode) {
                this.drawConnections(ctx);
            }
        }

        // current connection (the one being dragged by the mouse)
        if (this.connecting_pos != null) {
            ctx.lineWidth = this.connections_width;
            let link_color = null;

            switch (this.connecting_output.type) {
                case LiteGraph.EVENT:
                    link_color = LiteGraph.EVENT_LINK_COLOR;
                    break;
                default:
                    link_color = LiteGraph.CONNECTING_LINK_COLOR;
            }

            // the connection being dragged by the mouse
            this.renderLink(
                    ctx,
                    this.connecting_pos,
                    [this.graph_mouse[0], this.graph_mouse[1]],
                    null,
                    false,
                    null,
                    link_color,
                    this.connecting_output.dir ||
                        (this.connecting_node.horizontal
                            ? LiteGraph.DOWN
                            : LiteGraph.RIGHT),
                    LiteGraph.CENTER
            );

            ctx.beginPath();
            if (
                this.connecting_output.type === LiteGraph.EVENT ||
                    this.connecting_output.shape === LiteGraph.BOX_SHAPE
            ) {
                ctx.rect(
                        this.connecting_pos[0] - 6 + 0.5,
                        this.connecting_pos[1] - 5 + 0.5,
                        14,
                        10
                );
            } else {
                ctx.arc(
                        this.connecting_pos[0],
                        this.connecting_pos[1],
                        4,
                        0,
                        Math.PI * 2
                );
            }
            ctx.fill();

            ctx.fillStyle = '#ffcc00';
            if (this._highlight_input) {
                ctx.beginPath();
                ctx.arc(
                        this._highlight_input[0],
                        this._highlight_input[1],
                        6,
                        0,
                        Math.PI * 2
                );
                ctx.fill();
            }
        }

        // the selection rectangle
        if (this.dragging_rectangle) {
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(
                    this.dragging_rectangle[0],
                    this.dragging_rectangle[1],
                    this.dragging_rectangle[2],
                    this.dragging_rectangle[3]
            );
        }

        // on top of link center
        if (this.over_link_center && this.render_link_tooltip)
        { this.drawLinkTooltip(ctx, this.over_link_center); }
        else
        if (this.onDrawLinkTooltip) // to remove
        { this.onDrawLinkTooltip(ctx, null); }

        // custom info
        if (this.onDrawForeground) {
            this.onDrawForeground(ctx, this.visible_rect);
        }

        ctx.restore();
    }

    // draws panel in the corner 
    if (this._graph_stack && this._graph_stack.length) {
        this.drawSubgraphPanel(ctx);
    }


    if (this.onDrawOverlay) {
        this.onDrawOverlay(ctx);
    }

    if (this.dirty_area) {
        ctx.restore();
        // this.dirty_area = null;
    }

    if (ctx.finish2D) {
        // this is a function I use in webgl renderer
        ctx.finish2D();
    }
}visible_rect(ctx: any, visible_rect: any) {
        throw new Error("Method not implemented.");
    }
;

/**
     * draws the panel in the corner that shows subgraph properties
     * @method drawSubgraphPanel
     **/
drawSubgraphPanel(ctx: { fillStyle: string; globalAlpha: number; beginPath: () => void; roundRect: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; fill: () => void; font: string; textAlign: string; fillText: (arg0: string, arg1: number, arg2: number) => void; arc: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; measureText: (arg0: any) => any; }) {
    const subgraph = this.graph;
    const subnode = subgraph._subgraph_node;
    if (!subnode)
    {
        console.warn('subgraph without subnode');
        return;
    }

    const num = subnode.inputs ? subnode.inputs.length : 0;
    const w = 300;
    const h = Math.floor(LiteGraph.NODE_SLOT_HEIGHT * 1.6);

    ctx.fillStyle = '#111';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(10, 10, w, (num + 1) * h + 50, 8);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Graph Inputs', 20, 34);
    const pos = this.mouse;

    if (this.drawButton(w - 20, 20, 20, 20, 'X', '#151515'))
    {
        this.closeSubgraph();
        return;
    }

    let y = 50;
    ctx.font = '20px Arial';
    if (subnode.inputs)
    { for (let i = 0; i < subnode.inputs.length; ++i)
    {
        const input = subnode.inputs[i];
        if (input.not_subgraph_input)
        { continue; }

        // input button clicked
        if (this.drawButton(20, y + 2, w - 20, h - 2))
        {
            const type = subnode.constructor.input_node_type || 'graph/input';
            this.graph.beforeChange();
            const newnode = LiteGraph.createNode(type);
            if (newnode)
            {
                subgraph.add(newnode);
                this.block_click = false;
                this.last_click_position = null;
                this.selectNodes([newnode]);
                this.node_dragged = newnode;
                this.dragging_canvas = false;
                newnode.setProperty('name', input.name);
                newnode.setProperty('type', input.type);
                this.node_dragged.pos[0] = this.graph_mouse[0] - 5;
                this.node_dragged.pos[1] = this.graph_mouse[1] - 5;
                this.graph.afterChange();
            }
            else
            { console.error('graph input node not found:', type); }
        }

        ctx.fillStyle = '#9C9';
        ctx.beginPath();
        ctx.arc(w - 16, y + h * 0.5, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#AAA';
        ctx.fillText(input.name, 50, y + h * 0.75);
        const tw = ctx.measureText(input.name);
        ctx.fillStyle = '#777';
        ctx.fillText(input.type, 50 + tw.width + 10, y + h * 0.75);

        y += h;
    } }

    // add + button
    if (this.drawButton(20, y + 2, w - 20, h - 2, '+', '#151515', '#222'))
    {
        this.showSubgraphPropertiesDialog(subnode);
    }
};

// Draws a button into the canvas overlay and computes if it was clicked using the immediate gui paradigm
drawButton(x: number, y: number, w: number, h: number, text: string | null | undefined, bgcolor: string | undefined, hovercolor: string | undefined, textcolor: string | undefined)
{
    const ctx = this.ctx;
    bgcolor = bgcolor || LiteGraph.NODE_DEFAULT_COLOR;
    hovercolor = hovercolor || '#555';
    textcolor = textcolor || LiteGraph.NODE_TEXT_COLOR;

    let pos = this.mouse;
    const hover = LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);
    pos = this.last_click_position;
    const clicked = pos && LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);

    ctx.fillStyle = hover ? hovercolor : bgcolor;
    if (clicked)
    { ctx.fillStyle = '#AAA'; }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    if (text != null)
    {
        if (text.constructor == String)
        {
            ctx.fillStyle = textcolor;
            ctx.textAlign = 'center';
            ctx.font = ((h * 0.65) | 0) + 'px Arial';
            ctx.fillText(text, x + w * 0.5, y + h * 0.75);
            ctx.textAlign = 'left';
        }
    }

    const was_clicked = clicked && !this.block_click;
    if (clicked)
    { this.blockClick(); }
    return was_clicked;
};

isAreaClicked(x: any, y: any, w: any, h: any, hold_click: any)
{
    let pos = this.mouse;
    const hover = LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);
    pos = this.last_click_position;
    const clicked = pos && LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);
    const was_clicked = clicked && !this.block_click;
    if (clicked && hold_click)
    { this.blockClick(); }
    return was_clicked;
};

/**
     * draws some useful stats in the corner of the canvas
     * @method renderInfo
     **/
renderInfo(ctx: { save: () => void; translate: (arg0: any, arg1: any) => void; font: string; fillStyle: string; fillText: (arg0: string, arg1: number, arg2: number) => void; restore: () => void; }, x: number | undefined, y: number | undefined) {
    x = x || 10;
    y = y || this.canvas.height - 80;

    ctx.save();
    ctx.translate(x, y);

    ctx.font = '10px Arial';
    ctx.fillStyle = '#888';
    if (this.graph) {
        ctx.fillText('T: ' + this.graph.globaltime.toFixed(2) + 's', 5, 13 * 1);
        ctx.fillText('I: ' + this.graph.iteration, 5, 13 * 2);
        ctx.fillText('N: ' + this.graph._nodes.length + ' [' + this.visible_nodes.length + ']', 5, 13 * 3);
        ctx.fillText('V: ' + this.graph._version, 5, 13 * 4);
        ctx.fillText('FPS:' + this.fps.toFixed(2), 5, 13 * 5);
    } else {
        ctx.fillText('No graph selected', 5, 13 * 1);
    }
    ctx.restore();
};

/**
     * draws the back canvas (the one containing the background and the connections)
     * @method drawBackCanvas
     **/
drawBackCanvas() {
    const canvas = this.bgcanvas;
    if (
        canvas.width != this.canvas.width ||
            canvas.height != this.canvas.height
    ) {
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
    }

    if (!this.bgctx) {
        this.bgctx = this.bgcanvas.getContext('2d');
    }
    const ctx = this.bgctx;
    if (ctx.start) {
        ctx.start();
    }

    // clear
    if (this.clear_background) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (this._graph_stack && this._graph_stack.length) {
        ctx.save();
        const parent_graph = this._graph_stack[this._graph_stack.length - 1];
        const subgraph_node = this.graph._subgraph_node;
        ctx.strokeStyle = subgraph_node.bgcolor;
        ctx.lineWidth = 10;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        ctx.lineWidth = 1;
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = subgraph_node.bgcolor || '#AAA';
        let title = '';
        for (let i = 1; i < this._graph_stack.length; ++i) {
            title +=
                    this._graph_stack[i]._subgraph_node.getTitle() + ' >> ';
        }
        ctx.fillText(
                title + subgraph_node.getTitle(),
                canvas.width * 0.5,
                40
        );
        ctx.restore();
    }

    let bg_already_painted = false;
    if (this.onRenderBackground) {
        bg_already_painted = this.onRenderBackground(canvas, ctx);
    }

    // reset in case of error
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.visible_links.length = 0;

    if (this.graph) {
        // apply transformations
        ctx.save();
        this.ds.toCanvasContext(ctx);

        // render BG
        if (
            this.background_image &&
                this.ds.scale > 0.5 &&
                !bg_already_painted
        ) {
            if (this.zoom_modify_alpha) {
                ctx.globalAlpha =
                        (1.0 - 0.5 / this.ds.scale) * this.editor_alpha;
            } else {
                ctx.globalAlpha = this.editor_alpha;
            }
            ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = false;
            if (
                !this._bg_img ||
                    this._bg_img.name != this.background_image
            ) {
                this._bg_img = new Image();
                this._bg_img.name = this.background_image;
                this._bg_img.src = this.background_image;
                const that = this;
                this._bg_img.onload = function() {
                    that.draw(true, true);
                };
            }

            let pattern = null;
            if (this._pattern == null && this._bg_img.width > 0) {
                pattern = ctx.createPattern(this._bg_img, 'repeat');
                this._pattern_img = this._bg_img;
                this._pattern = pattern;
            } else {
                pattern = this._pattern;
            }
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(
                        this.visible_area[0],
                        this.visible_area[1],
                        this.visible_area[2],
                        this.visible_area[3]
                );
                ctx.fillStyle = 'transparent';
            }

            ctx.globalAlpha = 1.0;
            ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = true;
        }

        // groups
        if (this.graph._groups.length && !this.live_mode) {
            this.drawGroups(canvas, ctx);
        }

        if (this.onDrawBackground) {
            this.onDrawBackground(ctx, this.visible_area);
        }
        if (this.onBackgroundRender) {
            // LEGACY
            console.error(
                    'WARNING! onBackgroundRender deprecated, now is named onDrawBackground '
            );
            this.onBackgroundRender = null;
        }

        // DEBUG: show clipping area
        // ctx.fillStyle = "red";
        // ctx.fillRect( this.visible_area[0] + 10, this.visible_area[1] + 10, this.visible_area[2] - 20, this.visible_area[3] - 20);

        // bg
        if (this.render_canvas_border) {
            ctx.strokeStyle = '#235';
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }

        if (this.render_connections_shadows) {
            ctx.shadowColor = '#000';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 6;
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0)';
        }

        // draw connections
        if (!this.live_mode) {
            this.drawConnections(ctx);
        }

        ctx.shadowColor = 'rgba(0,0,0,0)';

        // restore state
        ctx.restore();
    }

    if (ctx.finish) {
        ctx.finish();
    }

    this.dirty_bgcanvas = false;
    this.dirty_canvas = true; // to force to repaint the front canvas with the bgcanvas
};

/**
     * draws the given node inside the canvas
     * @method drawNode
     **/
drawNode(node, ctx: { shadowColor: string; globalAlpha: number; shadowOffsetX: number; shadowOffsetY: number; shadowBlur: number; font: string; measureText: (arg0: any) => { (): any; new(): any; width: number; }; save: () => void; beginPath: () => void; rect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; roundRect: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; arc: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; clip: () => void; textAlign: string; lineWidth: number; fillStyle: string; moveTo: (arg0: number, arg1: number) => void; lineTo: (arg0: number, arg1: number) => void; closePath: () => void; fill: () => void; fillText: (arg0: any, arg1: number, arg2: number) => void; strokeStyle: string; stroke: () => void; restore: () => void; }) {
    let glow = false;
    this.current_node = node;

    const color = node.color || node.constructor.color || LiteGraph.NODE_DEFAULT_COLOR;
    let bgcolor = node.bgcolor || node.constructor.bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;

    // shadow and glow
    if (node.mouseOver) {
        glow = true;
    }

    const low_quality = this.ds.scale < 0.6; // zoomed out

    // only render if it forces it to do it
    if (this.live_mode) {
        if (!node.flags.collapsed) {
            ctx.shadowColor = 'transparent';
            if (node.onDrawForeground) {
                node.onDrawForeground(ctx, this, this.canvas);
            }
        }
        return;
    }

    const editor_alpha = this.editor_alpha;
    ctx.globalAlpha = editor_alpha;

    if (this.render_shadows && !low_quality) {
        ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
        ctx.shadowOffsetX = 2 * this.ds.scale;
        ctx.shadowOffsetY = 2 * this.ds.scale;
        ctx.shadowBlur = 3 * this.ds.scale;
    } else {
        ctx.shadowColor = 'transparent';
    }

    // custom draw collapsed method (draw after shadows because they are affected)
    if (
        node.flags.collapsed &&
            node.onDrawCollapsed &&
            node.onDrawCollapsed(ctx, this) == true
    ) {
        return;
    }

    // clip if required (mask)
    const shape = node._shape || LiteGraph.BOX_SHAPE;
    const size = temp_vec2;
    temp_vec2.set(node.size);
    const horizontal = node.horizontal; // || node.flags.horizontal;

    if (node.flags.collapsed) {
        ctx.font = this.inner_text_font;
        const title = node.getTitle ? node.getTitle() : node.title;
        if (title != null) {
            node._collapsed_width = Math.min(
                    node.size[0],
                    ctx.measureText(title).width +
                        LiteGraph.NODE_TITLE_HEIGHT * 2
            ); // LiteGraph.NODE_COLLAPSED_WIDTH;
            size[0] = node._collapsed_width;
            size[1] = 0;
        }
    }

    if (node.clip_area) {
        // Start clipping
        ctx.save();
        ctx.beginPath();
        if (shape == LiteGraph.BOX_SHAPE) {
            ctx.rect(0, 0, size[0], size[1]);
        } else if (shape == LiteGraph.ROUND_SHAPE) {
            ctx.roundRect(0, 0, size[0], size[1], 10);
        } else if (shape == LiteGraph.CIRCLE_SHAPE) {
            ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5,
                    0,
                    Math.PI * 2
            );
        }
        ctx.clip();
    }

    // draw shape
    if (node.has_errors) {
        bgcolor = 'red';
    }
    this.drawNodeShape(
            node,
            ctx,
            size,
            color,
            bgcolor,
            node.is_selected,
            node.mouseOver
    );
    ctx.shadowColor = 'transparent';

    // draw foreground
    if (node.onDrawForeground) {
        node.onDrawForeground(ctx, this, this.canvas);
    }

    // connection slots
    ctx.textAlign = horizontal ? 'center' : 'left';
    ctx.font = this.inner_text_font;

    const render_text = !low_quality;

    const out_slot = this.connecting_output;
    ctx.lineWidth = 1;

    let max_y = 0;
    const slot_pos = new Float32Array(2); // to reuse

    // render inputs and outputs
    if (!node.flags.collapsed) {
        // input connection slots
        if (node.inputs) {
            for (var i = 0; i < node.inputs.length; i++) {
                var slot = node.inputs[i];

                ctx.globalAlpha = editor_alpha;
                // change opacity of incompatible slots when dragging a connection
                if (this.connecting_node && !LiteGraph.isValidConnection(slot.type, out_slot.type)) {
                    ctx.globalAlpha = 0.4 * editor_alpha;
                }

                ctx.fillStyle =
                        slot.link != null
                            ? slot.color_on ||
                              this.default_connection_color.input_on
                            : slot.color_off ||
                              this.default_connection_color.input_off;

                var pos = node.getConnectionPos(true, i, slot_pos);
                pos[0] -= node.pos[0];
                pos[1] -= node.pos[1];
                if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                    max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                }

                ctx.beginPath();

                if (
                    slot.type === LiteGraph.EVENT ||
                        slot.shape === LiteGraph.BOX_SHAPE
                ) {
                    if (horizontal) {
                        ctx.rect(
                                pos[0] - 5 + 0.5,
                                pos[1] - 8 + 0.5,
                                10,
                                14
                        );
                    } else {
                        ctx.rect(
                                pos[0] - 6 + 0.5,
                                pos[1] - 5 + 0.5,
                                14,
                                10
                        );
                    }
                } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                    ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
                    ctx.closePath();
                } else {
                    if (low_quality)
	                        { ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8); } // faster
                    else
	                        { ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2); }
                }
                ctx.fill();

                // render name
                if (render_text) {
                    var text = slot.label != null ? slot.label : slot.name;
                    if (text) {
                        ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                        if (horizontal || slot.dir == LiteGraph.UP) {
                            ctx.fillText(text, pos[0], pos[1] - 10);
                        } else {
                            ctx.fillText(text, pos[0] + 10, pos[1] + 5);
                        }
                    }
                }
            }
        }

        // output connection slots
        if (this.connecting_node) {
            ctx.globalAlpha = 0.4 * editor_alpha;
        }

        ctx.textAlign = horizontal ? 'center' : 'right';
        ctx.strokeStyle = 'black';
        if (node.outputs) {
            for (var i = 0; i < node.outputs.length; i++) {
                var slot = node.outputs[i];

                var pos = node.getConnectionPos(false, i, slot_pos);
                pos[0] -= node.pos[0];
                pos[1] -= node.pos[1];
                if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                    max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                }

                ctx.fillStyle =
                        slot.links && slot.links.length
                            ? slot.color_on ||
                              this.default_connection_color.output_on
                            : slot.color_off ||
                              this.default_connection_color.output_off;
                ctx.beginPath();
                // ctx.rect( node.size[0] - 14,i*14,10,10);

                if (
                    slot.type === LiteGraph.EVENT ||
                        slot.shape === LiteGraph.BOX_SHAPE
                ) {
                    if (horizontal) {
                        ctx.rect(
                                pos[0] - 5 + 0.5,
                                pos[1] - 8 + 0.5,
                                10,
                                14
                        );
                    } else {
                        ctx.rect(
                                pos[0] - 6 + 0.5,
                                pos[1] - 5 + 0.5,
                                14,
                                10
                        );
                    }
                } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                    ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
                    ctx.closePath();
                } else {
                    if (low_quality)
	                        { ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8); }
                    else
	                        { ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2); }
                }

                // trigger
                // if(slot.node_id != null && slot.slot == -1)
                //	ctx.fillStyle = "#F85";

                // if(slot.links != null && slot.links.length)
                ctx.fill();
                if (!low_quality)
	                    { ctx.stroke(); }

                // render output name
                if (render_text) {
                    var text = slot.label != null ? slot.label : slot.name;
                    if (text) {
                        ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                        if (horizontal || slot.dir == LiteGraph.DOWN) {
                            ctx.fillText(text, pos[0], pos[1] - 8);
                        } else {
                            ctx.fillText(text, pos[0] - 10, pos[1] + 5);
                        }
                    }
                }
            }
        }

        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;

        if (node.widgets) {
            let widgets_y = max_y;
            if (horizontal || node.widgets_up) {
                widgets_y = 2;
            }
            if (node.widgets_start_y != null)
            { widgets_y = node.widgets_start_y; }
            this.drawNodeWidgets(
                    node,
                    widgets_y,
                    ctx,
                    this.node_widget && this.node_widget[0] == node
                        ? this.node_widget[1]
                        : null
            );
        }
    } else if (this.render_collapsed_slots) {
        // if collapsed
        let input_slot = null;
        let output_slot = null;

        // get first connected slot to render
        if (node.inputs) {
            for (var i = 0; i < node.inputs.length; i++) {
                var slot = node.inputs[i];
                if (slot.link == null) {
                    continue;
                }
                input_slot = slot;
                break;
            }
        }
        if (node.outputs) {
            for (var i = 0; i < node.outputs.length; i++) {
                var slot = node.outputs[i];
                if (!slot.links || !slot.links.length) {
                    continue;
                }
                output_slot = slot;
            }
        }

        if (input_slot) {
            var x = 0;
            var y = LiteGraph.NODE_TITLE_HEIGHT * -0.5; // center
            if (horizontal) {
                x = node._collapsed_width * 0.5;
                y = -LiteGraph.NODE_TITLE_HEIGHT;
            }
            ctx.fillStyle = '#686';
            ctx.beginPath();
            if (
                slot.type === LiteGraph.EVENT ||
                    slot.shape === LiteGraph.BOX_SHAPE
            ) {
                ctx.rect(x - 7 + 0.5, y - 4, 14, 8);
            } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                ctx.moveTo(x + 8, y);
                ctx.lineTo(x + -4, y - 4);
                ctx.lineTo(x + -4, y + 4);
                ctx.closePath();
            } else {
                ctx.arc(x, y, 4, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        if (output_slot) {
            var x = node._collapsed_width;
            var y = LiteGraph.NODE_TITLE_HEIGHT * -0.5; // center
            if (horizontal) {
                x = node._collapsed_width * 0.5;
                y = 0;
            }
            ctx.fillStyle = '#686';
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            if (
                slot.type === LiteGraph.EVENT ||
                    slot.shape === LiteGraph.BOX_SHAPE
            ) {
                ctx.rect(x - 7 + 0.5, y - 4, 14, 8);
            } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                ctx.moveTo(x + 6, y);
                ctx.lineTo(x - 6, y - 4);
                ctx.lineTo(x - 6, y + 4);
                ctx.closePath();
            } else {
                ctx.arc(x, y, 4, 0, Math.PI * 2);
            }
            ctx.fill();
            // ctx.stroke();
        }
    }

    if (node.clip_area) {
        ctx.restore();
    }

    ctx.globalAlpha = 1.0;
};

// used by this.over_link_center
drawLinkTooltip(ctx: { fillStyle: string; beginPath: () => void; arc: (arg0: any, arg1: any, arg2: number, arg3: number, arg4: number) => void; fill: () => void; font: string; measureText: (arg0: any) => any; shadowColor: string; shadowOffsetX: number; shadowOffsetY: number; shadowBlur: number; roundRect: (arg0: number, arg1: number, arg2: any, arg3: number, arg4: number, arg5: number) => void; moveTo: (arg0: number, arg1: number) => void; lineTo: (arg0: any, arg1: number) => void; textAlign: string; fillText: (arg0: any, arg1: any, arg2: number) => void; }, link: { _pos: any; data: null; } | null)
{
    const pos = link._pos;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 3, 0, Math.PI * 2);
    ctx.fill();

    if (link.data == null)
    { return; }

    if (this.onDrawLinkTooltip)
    { if (this.onDrawLinkTooltip(ctx, link, this) == true)
    { return; } }

    const data = link.data;
    let text = null;

    if (data.constructor === Number)
    { text = data.toFixed(2); }
    else if (data.constructor === String)
    { text = '"' + data + '"'; }
    else if (data.constructor === Boolean)
    { text = String(data); }
    else if (data.toToolTip)
    { text = data.toToolTip(); }
    else
    { text = '[' + data.constructor.name + ']'; }

    if (text == null)
    { return; }
    text = text.substr(0, 30); // avoid weird

    ctx.font = '14px Courier New';
    const info = ctx.measureText(text);
    const w = info.width + 20;
    const h = 24;
    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#454';
    ctx.beginPath();
    ctx.roundRect(pos[0] - w * 0.5, pos[1] - 15 - h, w, h, 3, 3);
    ctx.moveTo(pos[0] - 10, pos[1] - 15);
    ctx.lineTo(pos[0] + 10, pos[1] - 15);
    ctx.lineTo(pos[0], pos[1] - 5);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#CEC';
    ctx.fillText(text, pos[0], pos[1] - 15 - h * 0.3);
};

/**
     * draws the shape of the given node in the canvas
     * @method drawNodeShape
     **/

drawNodeShape(
    node,
    ctx: { strokeStyle: string; fillStyle: string; globalAlpha: number; beginPath: () => void; fillRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; roundRect: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number, arg5: number | undefined) => void; arc: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; fill: () => void; shadowColor: string; createLinearGradient: (arg0: number, arg1: number, arg2: number, arg3: number) => any; rect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; font: string; textAlign: string; measureText: (arg0: string) => any; fillText: (arg0: string, arg1: number, arg2: number) => void; moveTo: (arg0: number, arg1: number) => void; lineTo: (arg0: number, arg1: number) => void; lineWidth: number; stroke: () => void; },
    size: number[] | Float32Array,
    fgcolor: any,
    bgcolor: any,
    selected: any,
    mouse_over: any
) {
    // bg rect
    ctx.strokeStyle = fgcolor;
    ctx.fillStyle = bgcolor;

    const title_height = LiteGraph.NODE_TITLE_HEIGHT;
    const low_quality = this.ds.scale < 0.5;

    // render node area depending on shape
    const shape =
            node._shape || node.constructor.shape || LiteGraph.ROUND_SHAPE;

    const title_mode = node.constructor.title_mode;

    let render_title = true;
    if (title_mode == LiteGraph.TRANSPARENT_TITLE) {
        render_title = false;
    } else if (title_mode == LiteGraph.AUTOHIDE_TITLE && mouse_over) {
        render_title = true;
    }

    const area = tmp_area;
    area[0] = 0; // x
    area[1] = render_title ? -title_height : 0; // y
    area[2] = size[0] + 1; // w
    area[3] = render_title ? size[1] + title_height : size[1]; // h

    const old_alpha = ctx.globalAlpha;

    // full node shape
    // if(node.flags.collapsed)
    {
        ctx.beginPath();
        if (shape == LiteGraph.BOX_SHAPE || low_quality) {
            ctx.fillRect(area[0], area[1], area[2], area[3]);
        } else if (
            shape == LiteGraph.ROUND_SHAPE ||
                shape == LiteGraph.CARD_SHAPE
        ) {
            ctx.roundRect(
                    area[0],
                    area[1],
                    area[2],
                    area[3],
                    this.round_radius,
                    shape == LiteGraph.CARD_SHAPE ? 0 : this.round_radius
            );
        } else if (shape == LiteGraph.CIRCLE_SHAPE) {
            ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5,
                    0,
                    Math.PI * 2
            );
        }
        ctx.fill();

        // separator
        if (!node.flags.collapsed)
        {
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, -1, area[2], 2);
        }
    }
    ctx.shadowColor = 'transparent';

    if (node.onDrawBackground) {
        node.onDrawBackground(ctx, this, this.canvas, this.graph_mouse);
    }

    // title bg (remember, it is rendered ABOVE the node)
    if (render_title || title_mode == LiteGraph.TRANSPARENT_TITLE) {
        // title bar
        if (node.onDrawTitleBar) {
            node.onDrawTitleBar(ctx, title_height, size, this.ds.scale, fgcolor);
        } else if (
            title_mode != LiteGraph.TRANSPARENT_TITLE &&
                (node.constructor.title_color || this.render_title_colored)
        ) {
            const title_color = node.constructor.title_color || fgcolor;

            if (node.flags.collapsed) {
                ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
            }

            //* gradient test
            if (this.use_gradients) {
                let grad = LGraphCanvas.gradients[title_color];
                if (!grad) {
                    grad = LGraphCanvas.gradients[ title_color ] = ctx.createLinearGradient(0, 0, 400, 0);
                    grad.addColorStop(0, title_color);
                    grad.addColorStop(1, '#000');
                }
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = title_color;
            }

            // ctx.globalAlpha = 0.5 * old_alpha;
            ctx.beginPath();
            if (shape == LiteGraph.BOX_SHAPE || low_quality) {
                ctx.rect(0, -title_height, size[0] + 1, title_height);
            } else if (shape == LiteGraph.ROUND_SHAPE || shape == LiteGraph.CARD_SHAPE) {
                ctx.roundRect(
                        0,
                        -title_height,
                        size[0] + 1,
                        title_height,
                        this.round_radius,
                        node.flags.collapsed ? this.round_radius : 0
                );
            }
            ctx.fill();
            ctx.shadowColor = 'transparent';
        }

        // title box
        const box_size = 10;
        if (node.onDrawTitleBox) {
            node.onDrawTitleBox(ctx, title_height, size, this.ds.scale);
        } else if (
            shape == LiteGraph.ROUND_SHAPE ||
                shape == LiteGraph.CIRCLE_SHAPE ||
                shape == LiteGraph.CARD_SHAPE
        ) {
            if (low_quality) {
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(
                        title_height * 0.5,
                        title_height * -0.5,
                        box_size * 0.5 + 1,
                        0,
                        Math.PI * 2
                );
                ctx.fill();
            }

            ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
            if (low_quality)
            { ctx.fillRect(title_height * 0.5 - box_size * 0.5, title_height * -0.5 - box_size * 0.5, box_size, box_size); }
            else
            {
                ctx.beginPath();
                ctx.arc(
						title_height * 0.5,
						title_height * -0.5,
						box_size * 0.5,
						0,
						Math.PI * 2
                );
                ctx.fill();
            }
        } else {
            if (low_quality) {
                ctx.fillStyle = 'black';
                ctx.fillRect(
                        (title_height - box_size) * 0.5 - 1,
                        (title_height + box_size) * -0.5 - 1,
                        box_size + 2,
                        box_size + 2
                );
            }
            ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
            ctx.fillRect(
                    (title_height - box_size) * 0.5,
                    (title_height + box_size) * -0.5,
                    box_size,
                    box_size
            );
        }
        ctx.globalAlpha = old_alpha;

        // title text
        if (node.onDrawTitleText) {
            node.onDrawTitleText(
                    ctx,
                    title_height,
                    size,
                    this.ds.scale,
                    this.title_text_font,
                    selected
            );
        }
        if (!low_quality) {
            ctx.font = this.title_text_font;
            const title = String(node.getTitle());
            if (title) {
                if (selected) {
                    ctx.fillStyle = LiteGraph.NODE_SELECTED_TITLE_COLOR;
                } else {
                    ctx.fillStyle =
                            node.constructor.title_text_color ||
                            this.node_title_color;
                }
                if (node.flags.collapsed) {
                    ctx.textAlign = 'left';
                    const measure = ctx.measureText(title);
                    ctx.fillText(
                            title.substr(0, 20), // avoid urls too long
                            title_height, // + measure.width * 0.5,
                            LiteGraph.NODE_TITLE_TEXT_Y - title_height
                    );
                    ctx.textAlign = 'left';
                } else {
                    ctx.textAlign = 'left';
                    ctx.fillText(
                            title,
                            title_height,
                            LiteGraph.NODE_TITLE_TEXT_Y - title_height
                    );
                }
            }
        }

        // subgraph box
        if (!node.flags.collapsed && node.subgraph && !node.skip_subgraph_button) {
            const w = LiteGraph.NODE_TITLE_HEIGHT;
            const x = node.size[0] - w;
            const over = LiteGraph.isInsideRectangle(this.graph_mouse[0] - node.pos[0], this.graph_mouse[1] - node.pos[1], x + 2, -w + 2, w - 4, w - 4);
            ctx.fillStyle = over ? '#888' : '#555';
            if (shape == LiteGraph.BOX_SHAPE || low_quality)
            { ctx.fillRect(x + 2, -w + 2, w - 4, w - 4); }
            else
            {
                ctx.beginPath();
                ctx.roundRect(x + 2, -w + 2, w - 4, w - 4, 4);
                ctx.fill();
            }
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, -w * 0.6);
            ctx.lineTo(x + w * 0.8, -w * 0.6);
            ctx.lineTo(x + w * 0.5, -w * 0.3);
            ctx.fill();
        }

        // custom title render
        if (node.onDrawTitle) {
            node.onDrawTitle(ctx);
        }
    }

    // render selection marker
    if (selected) {
        if (node.onBounding) {
            node.onBounding(area);
        }

        if (title_mode == LiteGraph.TRANSPARENT_TITLE) {
            area[1] -= title_height;
            area[3] += title_height;
        }
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        if (shape == LiteGraph.BOX_SHAPE) {
            ctx.rect(
                    -6 + area[0],
                    -6 + area[1],
                    12 + area[2],
                    12 + area[3]
            );
        } else if (
            shape == LiteGraph.ROUND_SHAPE ||
                (shape == LiteGraph.CARD_SHAPE && node.flags.collapsed)
        ) {
            ctx.roundRect(
                    -6 + area[0],
                    -6 + area[1],
                    12 + area[2],
                    12 + area[3],
                    this.round_radius * 2
            );
        } else if (shape == LiteGraph.CARD_SHAPE) {
            ctx.roundRect(
                    -6 + area[0],
                    -6 + area[1],
                    12 + area[2],
                    12 + area[3],
                    this.round_radius * 2,
                    2
            );
        } else if (shape == LiteGraph.CIRCLE_SHAPE) {
            ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5 + 6,
                    0,
                    Math.PI * 2
            );
        }
        ctx.strokeStyle = LiteGraph.NODE_BOX_OUTLINE_COLOR;
        ctx.stroke();
        ctx.strokeStyle = fgcolor;
        ctx.globalAlpha = 1;
    }
};

/**
     * draws every connection visible in the canvas
     * OPTIMIZE THIS: pre-catch connections position instead of recomputing them every time
     * @method drawConnections
     **/
drawConnections(ctx: { lineWidth: number; fillStyle: string; strokeStyle: string; globalAlpha: number; }) {
    const now = LiteGraph.getTime();
    const visible_area = this.visible_area;
    margin_area[0] = visible_area[0] - 20;
    margin_area[1] = visible_area[1] - 20;
    margin_area[2] = visible_area[2] + 40;
    margin_area[3] = visible_area[3] + 40;

    // draw connections
    ctx.lineWidth = this.connections_width;

    ctx.fillStyle = '#AAA';
    ctx.strokeStyle = '#AAA';
    ctx.globalAlpha = this.editor_alpha;
    // for every node
    const nodes = this.graph._nodes;
    for (let n = 0, l = nodes.length; n < l; ++n) {
        const node = nodes[n];
        // for every input (we render just inputs because it is easier as every slot can only have one input)
        if (!node.inputs || !node.inputs.length) {
            continue;
        }

        for (let i = 0; i < node.inputs.length; ++i) {
            const input = node.inputs[i];
            if (!input || input.link == null) {
                continue;
            }
            const link_id = input.link;
            const link = this.graph.links[link_id];
            if (!link) {
                continue;
            }

            // find link info
            const start_node = this.graph.getNodeById(link.origin_id);
            if (start_node == null) {
                continue;
            }
            const start_node_slot = link.origin_slot;
            let start_node_slotpos = null;
            if (start_node_slot == -1) {
                start_node_slotpos = [
                    start_node.pos[0] + 10,
                    start_node.pos[1] + 10,
                ];
            } else {
                start_node_slotpos = start_node.getConnectionPos(
                        false,
                        start_node_slot,
                        tempA
                );
            }
            const end_node_slotpos = node.getConnectionPos(true, i, tempB);

            // compute link bounding
            link_bounding[0] = start_node_slotpos[0];
            link_bounding[1] = start_node_slotpos[1];
            link_bounding[2] = end_node_slotpos[0] - start_node_slotpos[0];
            link_bounding[3] = end_node_slotpos[1] - start_node_slotpos[1];
            if (link_bounding[2] < 0) {
                link_bounding[0] += link_bounding[2];
                link_bounding[2] = Math.abs(link_bounding[2]);
            }
            if (link_bounding[3] < 0) {
                link_bounding[1] += link_bounding[3];
                link_bounding[3] = Math.abs(link_bounding[3]);
            }

            // skip links outside of the visible area of the canvas
            if (!overlapBounding(link_bounding, margin_area)) {
                continue;
            }

            const start_slot = start_node.outputs[start_node_slot];
            const end_slot = node.inputs[i];
            if (!start_slot || !end_slot) {
                continue;
            }
            const start_dir =
                    start_slot.dir ||
                    (start_node.horizontal ? LiteGraph.DOWN : LiteGraph.RIGHT);
            const end_dir =
                    end_slot.dir ||
                    (node.horizontal ? LiteGraph.UP : LiteGraph.LEFT);

            this.renderLink(
                    ctx,
                    start_node_slotpos,
                    end_node_slotpos,
                    link,
                    false,
                    0,
                    null,
                    start_dir,
                    end_dir
            );

            // event triggered rendered on top
            if (link && link._last_time && now - link._last_time < 1000) {
                const f = 2.0 - (now - link._last_time) * 0.002;
                const tmp = ctx.globalAlpha;
                ctx.globalAlpha = tmp * f;
                this.renderLink(
                        ctx,
                        start_node_slotpos,
                        end_node_slotpos,
                        link,
                        true,
                        f,
                        'white',
                        start_dir,
                        end_dir
                );
                ctx.globalAlpha = tmp;
            }
        }
    }
    ctx.globalAlpha = 1;
};

/**
     * draws a link between two points
     * @method renderLink
     * @param {vec2} a start pos
     * @param {vec2} b end pos
     * @param {Object} link the link object with all the link info
     * @param {boolean} skip_border ignore the shadow of the link
     * @param {boolean} flow show flow animation (for events)
     * @param {string} color the color for the link
     * @param {number} start_dir the direction enum
     * @param {number} end_dir the direction enum
     * @param {number} num_sublines number of sublines (useful to represent vec3 or rgb)
     **/
renderLink(
    ctx: { lineWidth: number; lineJoin: string; beginPath: () => void; moveTo: (arg0: number, arg1: number) => void; bezierCurveTo: (arg0: any, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any) => void; lineTo: (arg0: number, arg1: number) => void; strokeStyle: string; stroke: () => void; fillStyle: any; save: () => void; translate: (arg0: number, arg1: number) => void; rotate: (arg0: number) => void; fill: () => void; restore: () => void; arc: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; },
    a: number[],
    b: number[],
    link: { color: any; type: string | number; id: string | number; _pos: number[]; } | null,
    skip_border: boolean,
    flow: number | null,
    color: string | null,
    start_dir: number,
    end_dir: number,
    num_sublines: number | undefined
) {
    if (link) {
        this.visible_links.push(link);
    }

    // choose color
    if (!color && link) {
        color = link.color || LGraphCanvas.link_type_colors[link.type];
    }
    if (!color) {
        color = this.default_link_color;
    }
    if (link != null && this.highlighted_links[link.id]) {
        color = '#FFF';
    }

    start_dir = start_dir || LiteGraph.RIGHT;
    end_dir = end_dir || LiteGraph.LEFT;

    const dist = distance(a, b);

    if (this.render_connections_border && this.ds.scale > 0.6) {
        ctx.lineWidth = this.connections_width + 4;
    }
    ctx.lineJoin = 'round';
    num_sublines = num_sublines || 1;
    if (num_sublines > 1) {
        ctx.lineWidth = 0.5;
    }

    // begin line shape
    ctx.beginPath();
    for (var i = 0; i < num_sublines; i += 1) {
        const offsety = (i - (num_sublines - 1) * 0.5) * 5;

        if (this.links_render_mode == LiteGraph.SPLINE_LINK) {
            ctx.moveTo(a[0], a[1] + offsety);
            var start_offset_x = 0;
            var start_offset_y = 0;
            var end_offset_x = 0;
            var end_offset_y = 0;
            switch (start_dir) {
                case LiteGraph.LEFT:
                    start_offset_x = dist * -0.25;
                    break;
                case LiteGraph.RIGHT:
                    start_offset_x = dist * 0.25;
                    break;
                case LiteGraph.UP:
                    start_offset_y = dist * -0.25;
                    break;
                case LiteGraph.DOWN:
                    start_offset_y = dist * 0.25;
                    break;
            }
            switch (end_dir) {
                case LiteGraph.LEFT:
                    end_offset_x = dist * -0.25;
                    break;
                case LiteGraph.RIGHT:
                    end_offset_x = dist * 0.25;
                    break;
                case LiteGraph.UP:
                    end_offset_y = dist * -0.25;
                    break;
                case LiteGraph.DOWN:
                    end_offset_y = dist * 0.25;
                    break;
            }
            ctx.bezierCurveTo(
                    a[0] + start_offset_x,
                    a[1] + start_offset_y + offsety,
                    b[0] + end_offset_x,
                    b[1] + end_offset_y + offsety,
                    b[0],
                    b[1] + offsety
            );
        } else if (this.links_render_mode == LiteGraph.LINEAR_LINK) {
            ctx.moveTo(a[0], a[1] + offsety);
            var start_offset_x = 0;
            var start_offset_y = 0;
            var end_offset_x = 0;
            var end_offset_y = 0;
            switch (start_dir) {
                case LiteGraph.LEFT:
                    start_offset_x = -1;
                    break;
                case LiteGraph.RIGHT:
                    start_offset_x = 1;
                    break;
                case LiteGraph.UP:
                    start_offset_y = -1;
                    break;
                case LiteGraph.DOWN:
                    start_offset_y = 1;
                    break;
            }
            switch (end_dir) {
                case LiteGraph.LEFT:
                    end_offset_x = -1;
                    break;
                case LiteGraph.RIGHT:
                    end_offset_x = 1;
                    break;
                case LiteGraph.UP:
                    end_offset_y = -1;
                    break;
                case LiteGraph.DOWN:
                    end_offset_y = 1;
                    break;
            }
            const l = 15;
            ctx.lineTo(
                    a[0] + start_offset_x * l,
                    a[1] + start_offset_y * l + offsety
            );
            ctx.lineTo(
                    b[0] + end_offset_x * l,
                    b[1] + end_offset_y * l + offsety
            );
            ctx.lineTo(b[0], b[1] + offsety);
        } else if (this.links_render_mode == LiteGraph.STRAIGHT_LINK) {
            ctx.moveTo(a[0], a[1]);
            let start_x = a[0];
            let start_y = a[1];
            let end_x = b[0];
            let end_y = b[1];
            if (start_dir == LiteGraph.RIGHT) {
                start_x += 10;
            } else {
                start_y += 10;
            }
            if (end_dir == LiteGraph.LEFT) {
                end_x -= 10;
            } else {
                end_y -= 10;
            }
            ctx.lineTo(start_x, start_y);
            ctx.lineTo((start_x + end_x) * 0.5, start_y);
            ctx.lineTo((start_x + end_x) * 0.5, end_y);
            ctx.lineTo(end_x, end_y);
            ctx.lineTo(b[0], b[1]);
        } else {
            return;
        } // unknown
    }

    // rendering the outline of the connection can be a little bit slow
    if (
        this.render_connections_border &&
            this.ds.scale > 0.6 &&
            !skip_border
    ) {
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
    }

    ctx.lineWidth = this.connections_width;
    ctx.fillStyle = ctx.strokeStyle = color;
    ctx.stroke();
    // end line shape

    var pos = this.computeConnectionPoint(a, b, 0.5, start_dir, end_dir);
    if (link && link._pos) {
        link._pos[0] = pos[0];
        link._pos[1] = pos[1];
    }

    // render arrow in the middle
    if (
        this.ds.scale >= 0.6 &&
            this.highquality_render &&
            end_dir != LiteGraph.CENTER
    ) {
        // render arrow
        if (this.render_connection_arrows) {
            // compute two points in the connection
            const posA = this.computeConnectionPoint(
                    a,
                    b,
                    0.25,
                    start_dir,
                    end_dir
            );
            const posB = this.computeConnectionPoint(
                    a,
                    b,
                    0.26,
                    start_dir,
                    end_dir
            );
            const posC = this.computeConnectionPoint(
                    a,
                    b,
                    0.75,
                    start_dir,
                    end_dir
            );
            const posD = this.computeConnectionPoint(
                    a,
                    b,
                    0.76,
                    start_dir,
                    end_dir
            );

            // compute the angle between them so the arrow points in the right direction
            let angleA = 0;
            let angleB = 0;
            if (this.render_curved_connections) {
                angleA = -Math.atan2(posB[0] - posA[0], posB[1] - posA[1]);
                angleB = -Math.atan2(posD[0] - posC[0], posD[1] - posC[1]);
            } else {
                angleB = angleA = b[1] > a[1] ? 0 : Math.PI;
            }

            // render arrow
            ctx.save();
            ctx.translate(posA[0], posA[1]);
            ctx.rotate(angleA);
            ctx.beginPath();
            ctx.moveTo(-5, -3);
            ctx.lineTo(0, +7);
            ctx.lineTo(+5, -3);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.translate(posC[0], posC[1]);
            ctx.rotate(angleB);
            ctx.beginPath();
            ctx.moveTo(-5, -3);
            ctx.lineTo(0, +7);
            ctx.lineTo(+5, -3);
            ctx.fill();
            ctx.restore();
        }

        // circle
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // render flowing points
    if (flow) {
        ctx.fillStyle = color;
        for (var i = 0; i < 5; ++i) {
            const f = (LiteGraph.getTime() * 0.001 + i * 0.2) % 1;
            var pos = this.computeConnectionPoint(
                    a,
                    b,
                    f,
                    start_dir,
                    end_dir
            );
            ctx.beginPath();
            ctx.arc(pos[0], pos[1], 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
};

// returns the link center point based on curvature
computeConnectionPoint(
    a: any[],
    b: any[],
    t: number,
    start_dir: number,
    end_dir: number
) {
    start_dir = start_dir || LiteGraph.RIGHT;
    end_dir = end_dir || LiteGraph.LEFT;

    const dist = distance(a, b);
    const p0 = a;
    const p1 = [a[0], a[1]];
    const p2 = [b[0], b[1]];
    const p3 = b;

    switch (start_dir) {
        case LiteGraph.LEFT:
            p1[0] += dist * -0.25;
            break;
        case LiteGraph.RIGHT:
            p1[0] += dist * 0.25;
            break;
        case LiteGraph.UP:
            p1[1] += dist * -0.25;
            break;
        case LiteGraph.DOWN:
            p1[1] += dist * 0.25;
            break;
    }
    switch (end_dir) {
        case LiteGraph.LEFT:
            p2[0] += dist * -0.25;
            break;
        case LiteGraph.RIGHT:
            p2[0] += dist * 0.25;
            break;
        case LiteGraph.UP:
            p2[1] += dist * -0.25;
            break;
        case LiteGraph.DOWN:
            p2[1] += dist * 0.25;
            break;
    }

    const c1 = (1 - t) * (1 - t) * (1 - t);
    const c2 = 3 * ((1 - t) * (1 - t)) * t;
    const c3 = 3 * (1 - t) * (t * t);
    const c4 = t * t * t;

    const x = c1 * p0[0] + c2 * p1[0] + c3 * p2[0] + c4 * p3[0];
    const y = c1 * p0[1] + c2 * p1[1] + c3 * p2[1] + c4 * p3[1];
    return [x, y];
};

drawExecutionOrder(ctx: { shadowColor: string; globalAlpha: number; textAlign: string; strokeStyle: string; fillStyle: string; fillRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; strokeRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; fillText: (arg0: any, arg1: any, arg2: number) => void; }) {
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 0.25;

    ctx.textAlign = 'center';
    ctx.strokeStyle = 'white';
    ctx.globalAlpha = 0.75;

    const visible_nodes = this.visible_nodes;
    for (let i = 0; i < visible_nodes.length; ++i) {
        const node = visible_nodes[i];
        ctx.fillStyle = 'black';
        ctx.fillRect(
                node.pos[0] - LiteGraph.NODE_TITLE_HEIGHT,
                node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT,
                LiteGraph.NODE_TITLE_HEIGHT,
                LiteGraph.NODE_TITLE_HEIGHT
        );
        if (node.order == 0) {
            ctx.strokeRect(
                    node.pos[0] - LiteGraph.NODE_TITLE_HEIGHT + 0.5,
                    node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5,
                    LiteGraph.NODE_TITLE_HEIGHT,
                    LiteGraph.NODE_TITLE_HEIGHT
            );
        }
        ctx.fillStyle = '#FFF';
        ctx.fillText(
                node.order,
                node.pos[0] + LiteGraph.NODE_TITLE_HEIGHT * -0.5,
                node.pos[1] - 6
        );
    }
    ctx.globalAlpha = 1;
};

/**
     * draws the widgets stored inside a node
     * @method drawNodeWidgets
     **/
drawNodeWidgets(
    node: { widgets: string | any[]; size: any[]; },
    posY: number,
    ctx: { save: () => void; globalAlpha: number; strokeStyle: string; fillStyle: string; textAlign: string; fillRect: (arg0: number, arg1: any, arg2: number, arg3: number) => void; strokeRect: (arg0: number, arg1: any, arg2: number, arg3: number) => void; fillText: (arg0: string, arg1: number, arg2: any) => void; beginPath: () => void; roundRect: (arg0: number, arg1: any, arg2: number, arg3: number, arg4: number) => void; rect: (arg0: number, arg1: any, arg2: number, arg3: number) => void; fill: () => void; stroke: () => void; arc: (arg0: number, arg1: any, arg2: number, arg3: number, arg4: number) => void; moveTo: (arg0: number, arg1: any) => void; lineTo: (arg0: number, arg1: number) => void; clip: () => void; restore: () => void; },
    active_widget: any
) {
    if (!node.widgets || !node.widgets.length) {
        return 0;
    }
    const width = node.size[0];
    const widgets = node.widgets;
    posY += 2;
    const H = LiteGraph.NODE_WIDGET_HEIGHT;
    const show_text = this.ds.scale > 0.5;
    ctx.save();
    ctx.globalAlpha = this.editor_alpha;
    const outline_color = LiteGraph.WIDGET_OUTLINE_COLOR;
    const background_color = LiteGraph.WIDGET_BGCOLOR;
    const text_color = LiteGraph.WIDGET_TEXT_COLOR;
    const secondary_text_color = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    const margin = 15;

    for (let i = 0; i < widgets.length; ++i) {
        const w = widgets[i];
        let y = posY;
        if (w.y) {
            y = w.y;
        }
        w.last_y = y;
        ctx.strokeStyle = outline_color;
        ctx.fillStyle = '#222';
        ctx.textAlign = 'left';
        // ctx.lineWidth = 2;
        if (w.disabled)
        { ctx.globalAlpha *= 0.5; }
        const widget_width = w.width || width;

        switch (w.type) {
            case 'button':
                if (w.clicked) {
                    ctx.fillStyle = '#AAA';
                    w.clicked = false;
                    this.dirty_canvas = true;
                }
                ctx.fillRect(margin, y, widget_width - margin * 2, H);
                if (show_text && !w.disabled)
	                    { ctx.strokeRect(margin, y, widget_width - margin * 2, H); }
                if (show_text) {
                    ctx.textAlign = 'center';
                    ctx.fillStyle = text_color;
                    ctx.fillText(w.name, widget_width * 0.5, y + H * 0.7);
                }
                break;
            case 'toggle':
                ctx.textAlign = 'left';
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = background_color;
                ctx.beginPath();
                if (show_text)
	                    { ctx.roundRect(margin, posY, widget_width - margin * 2, H, H * 0.5); }
                else
	                    { ctx.rect(margin, posY, widget_width - margin * 2, H); }
                ctx.fill();
                if (show_text && !w.disabled)
	                    { ctx.stroke(); }
                ctx.fillStyle = w.value ? '#89A' : '#333';
                ctx.beginPath();
                ctx.arc(widget_width - margin * 2, y + H * 0.5, H * 0.36, 0, Math.PI * 2);
                ctx.fill();
                if (show_text) {
                    ctx.fillStyle = secondary_text_color;
                    if (w.name != null) {
                        ctx.fillText(w.name, margin * 2, y + H * 0.7);
                    }
                    ctx.fillStyle = w.value ? text_color : secondary_text_color;
                    ctx.textAlign = 'right';
                    ctx.fillText(
                            w.value
                                ? w.options.on || 'true'
                                : w.options.off || 'false',
                            widget_width - 40,
                            y + H * 0.7
                    );
                }
                break;
            case 'slider':
                ctx.fillStyle = background_color;
                ctx.fillRect(margin, y, widget_width - margin * 2, H);
                var range = w.options.max - w.options.min;
                var nvalue = (w.value - w.options.min) / range;
                ctx.fillStyle = active_widget == w ? '#89A' : '#678';
                ctx.fillRect(margin, y, nvalue * (widget_width - margin * 2), H);
                if (show_text && !w.disabled)
	                    { ctx.strokeRect(margin, y, widget_width - margin * 2, H); }
                if (w.marker) {
                    const marker_nvalue = (w.marker - w.options.min) / range;
                    ctx.fillStyle = '#AA9';
                    ctx.fillRect(margin + marker_nvalue * (widget_width - margin * 2), y, 2, H);
                }
                if (show_text) {
                    ctx.textAlign = 'center';
                    ctx.fillStyle = text_color;
                    ctx.fillText(
                            w.name + '  ' + Number(w.value).toFixed(3),
                            widget_width * 0.5,
                            y + H * 0.7
                    );
                }
                break;
            case 'number':
            case 'combo':
                ctx.textAlign = 'left';
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = background_color;
                ctx.beginPath();
                if (show_text)
	                    { ctx.roundRect(margin, posY, widget_width - margin * 2, H, H * 0.5); }
                else
	                    { ctx.rect(margin, posY, widget_width - margin * 2, H); }
                ctx.fill();
                if (show_text) {
                    if (!w.disabled)
		                    { ctx.stroke(); }
                    ctx.fillStyle = text_color;
                    if (!w.disabled)
                    {
                        ctx.beginPath();
                        ctx.moveTo(margin + 16, posY + 5);
                        ctx.lineTo(margin + 6, posY + H * 0.5);
                        ctx.lineTo(margin + 16, posY + H - 5);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(widget_width - margin - 16, posY + 5);
                        ctx.lineTo(widget_width - margin - 6, posY + H * 0.5);
                        ctx.lineTo(widget_width - margin - 16, posY + H - 5);
                        ctx.fill();
                    }
                    ctx.fillStyle = secondary_text_color;
                    ctx.fillText(w.name, margin * 2 + 5, y + H * 0.7);
                    ctx.fillStyle = text_color;
                    ctx.textAlign = 'right';
                    if (w.type == 'number') {
                        ctx.fillText(
                                Number(w.value).toFixed(
                                    w.options.precision !== undefined
                                        ? w.options.precision
                                        : 3
                                ),
                                widget_width - margin * 2 - 20,
                                y + H * 0.7
                        );
                    } else {
                        let v = w.value;
                        if (w.options.values)
                        {
                            let values = w.options.values;
                            if (values.constructor === Function)
                            { values = values(); }
                            if (values && values.constructor !== Array)
                            { v = values[ w.value ]; }
                        }
                        ctx.fillText(
                                v,
                                widget_width - margin * 2 - 20,
                                y + H * 0.7
                        );
                    }
                }
                break;
            case 'string':
            case 'text':
                ctx.textAlign = 'left';
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = background_color;
                ctx.beginPath();
                if (show_text)
	                    { ctx.roundRect(margin, posY, widget_width - margin * 2, H, H * 0.5); }
                else
	                    { ctx.rect(margin, posY, widget_width - margin * 2, H); }
                ctx.fill();
	                if (show_text) {
                    if (!w.disabled)
                    { ctx.stroke(); }
    					ctx.save();
                    ctx.beginPath();
                    ctx.rect(margin, posY, widget_width - margin * 2, H);
                    ctx.clip();

	                    // ctx.stroke();
                    ctx.fillStyle = secondary_text_color;
                    if (w.name != null) {
                        ctx.fillText(w.name, margin * 2, y + H * 0.7);
                    }
                    ctx.fillStyle = text_color;
                    ctx.textAlign = 'right';
                    ctx.fillText(String(w.value).substr(0, 30), widget_width - margin * 2, y + H * 0.7); // 30 chars max
                    ctx.restore();
                }
                break;
            default:
                if (w.draw) {
                    w.draw(ctx, node, widget_width, y, H);
                }
                break;
        }
        posY += (w.computeSize ? w.computeSize(widget_width)[1] : H) + 4;
        ctx.globalAlpha = this.editor_alpha;

    }
    ctx.restore();
    ctx.textAlign = 'left';
};

/**
     * process an event on widgets
     * @method processNodeWidgets
     **/
processNodeWidgets(
    node: { widgets: string | any[]; pos: number[]; size: any[]; onWidgetChanged: (arg0: any, arg1: any, arg2: any, arg3: any) => void; graph: { _version: number; }; properties: { [x: string]: undefined; }; setProperty: (arg0: any, arg1: any) => void; },
    pos: number[],
    event: { type: string; deltaX: number; click_time: number; },
    active_widget: undefined
) {
    if (!node.widgets || !node.widgets.length) {
        return null;
    }

    const x = pos[0] - node.pos[0];
    const y = pos[1] - node.pos[1];
    const width = node.size[0];
    const that = this;
    const ref_window = this.getCanvasWindow();

    for (let i = 0; i < node.widgets.length; ++i) {
        var w = node.widgets[i];
        if (!w || w.disabled)
        { continue; }
        const widget_height = w.computeSize ? w.computeSize(width)[1] : LiteGraph.NODE_WIDGET_HEIGHT;
        const widget_width = w.width || width;
        // outside
        if (w != active_widget &&
				(x < 6 || x > widget_width - 12 || y < w.last_y || y > w.last_y + widget_height))
        { continue; }

        var old_value = w.value;

        // if ( w == active_widget || (x > 6 && x < widget_width - 12 && y > w.last_y && y < w.last_y + widget_height) ) {
        // inside widget
        switch (w.type) {
            case 'button':
                if (event.type === 'mousemove') {
                    break;
                }
                if (w.callback) {
                    setTimeout(function() {
                        w.callback(w, that, node, pos, event);
                    }, 20);
                }
                w.clicked = true;
                this.dirty_canvas = true;
                break;
            case 'slider':
                var range = w.options.max - w.options.min;
                var nvalue = Math.clamp((x - 15) / (widget_width - 30), 0, 1);
                w.value = w.options.min + (w.options.max - w.options.min) * nvalue;
                if (w.callback) {
                    setTimeout(function() {
                        inner_value_change(w, w.value);
                    }, 20);
                }
                this.dirty_canvas = true;
                break;
            case 'number':
            case 'combo':
                var old_value = w.value;
                if (event.type == 'mousemove' && w.type == 'number') {
                    w.value += event.deltaX * 0.1 * (w.options.step || 1);
                    if (w.options.min != null && w.value < w.options.min) {
                        w.value = w.options.min;
                    }
                    if (w.options.max != null && w.value > w.options.max) {
                        w.value = w.options.max;
                    }
                } else if (event.type == 'mousedown') {
                    var values = w.options.values;
                    if (values && values.constructor === Function) {
                        values = w.options.values(w, node);
                    }
                    var values_list: string | any[] | null = null;

                    if (w.type != 'number')
                    { values_list = values.constructor === Array ? values : Object.keys(values); }

                    var delta = x < 40 ? -1 : x > widget_width - 40 ? 1 : 0;
                    if (w.type == 'number') {
                        w.value += delta * 0.1 * (w.options.step || 1);
                        if (w.options.min != null && w.value < w.options.min) {
                            w.value = w.options.min;
                        }
                        if (w.options.max != null && w.value > w.options.max) {
                            w.value = w.options.max;
                        }
                    } else if (delta) { // clicked in arrow, used for combos 
                        let index = -1;
                        this.last_mouseclick = 0; // avoids dobl click event
                        if (values.constructor === Object)
                        { index = values_list.indexOf(String(w.value)) + delta; }
                        else
                        { index = values_list.indexOf(w.value) + delta; }
                        if (index >= values_list.length) {
                            index = values_list.length - 1;
                        }
                        if (index < 0) {
                            index = 0;
                        }
                        if (values.constructor === Array)
                        { w.value = values[index]; }
                        else
                        { w.value = index; }
                    } else { // combo clicked 
                        var text_values = values != values_list ? Object.values(values) : values;
                        const menu = new LiteGraph.ContextMenu(text_values, {
                            scale: Math.max(1, this.ds.scale),
                            event: event,
                            className: 'dark',
                            callback: inner_clicked.bind(w),
                        },
								ref_window);
                        function inner_clicked(v: any, option: any, event: any) {
                            if (values != values_list)
                            { v = text_values.indexOf(v); }
                            this.value = v;
                            inner_value_change(this, v);
                            that.dirty_canvas = true;
                            return false;
                        }
                    }
                } // end mousedown
                else if (event.type == 'mouseup' && w.type == 'number')
                {
                    var delta = x < 40 ? -1 : x > widget_width - 40 ? 1 : 0;
                    if (event.click_time < 200 && delta == 0) {
                        this.prompt('Value', w.value, function(v: any) {
                            this.value = Number(v);
                            inner_value_change(this, this.value);
                        }.bind(w),
								event);
                    }
                }

                if (old_value != w.value)
                { setTimeout(
							function() {
							    inner_value_change(this, this.value);
							}.bind(w),
							20
                ); }
                this.dirty_canvas = true;
                break;
            case 'toggle':
                if (event.type == 'mousedown') {
                    w.value = !w.value;
                    setTimeout(function() {
                        inner_value_change(w, w.value);
                    }, 20);
                }
                break;
            case 'string':
            case 'text':
                if (event.type == 'mousedown') {
                    this.prompt('Value', w.value, function(v: any) {
                        this.value = v;
                        inner_value_change(this, v);
                    }.bind(w),
							event, w.options ? w.options.multiline : false);
                }
                break;
            default:
                if (w.mouse) {
                    this.dirty_canvas = w.mouse(event, [x, y], node);
                }
                break;
        } // end switch

        // value changed
        if (old_value != w.value)
        {
            if (node.onWidgetChanged)
            { node.onWidgetChanged(w.name, w.value, old_value, w); }
            node.graph._version++;
        }

        return w;
    }// end for

    function inner_value_change(widget, value: any) {
        widget.value = value;
        if (widget.options && widget.options.property && node.properties[widget.options.property] !== undefined) {
            node.setProperty(widget.options.property, value);
        }
        if (widget.callback) {
            widget.callback(widget.value, that, node, pos, event);
        }
    }

    return null;
};

/**
     * draws every group area in the background
     * @method drawGroups
     **/
drawGroups(canvas: null, ctx: { save: () => void; globalAlpha: number; fillStyle: any; strokeStyle: any; beginPath: () => void; rect: (arg0: any, arg1: any, arg2: any, arg3: any) => void; fill: () => void; stroke: () => void; moveTo: (arg0: any, arg1: any) => void; lineTo: (arg0: number, arg1: number) => void; font: string; fillText: (arg0: any, arg1: any, arg2: any) => void; restore: () => void; }) {
    if (!this.graph) {
        return;
    }

    const groups = this.graph._groups;

    ctx.save();
    ctx.globalAlpha = 0.5 * this.editor_alpha;

    for (let i = 0; i < groups.length; ++i) {
        const group = groups[i];

        if (!overlapBounding(this.visible_area, group._bounding)) {
            continue;
        } // out of the visible area

        ctx.fillStyle = group.color || '#335';
        ctx.strokeStyle = group.color || '#335';
        const pos = group._pos;
        const size = group._size;
        ctx.globalAlpha = 0.25 * this.editor_alpha;
        ctx.beginPath();
        ctx.rect(pos[0] + 0.5, pos[1] + 0.5, size[0], size[1]);
        ctx.fill();
        ctx.globalAlpha = this.editor_alpha;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos[0] + size[0], pos[1] + size[1]);
        ctx.lineTo(pos[0] + size[0] - 10, pos[1] + size[1]);
        ctx.lineTo(pos[0] + size[0], pos[1] + size[1] - 10);
        ctx.fill();

        const font_size =
                group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
        ctx.font = font_size + 'px Arial';
        ctx.fillText(group.title, pos[0] + 4, pos[1] + font_size);
    }

    ctx.restore();
};

adjustNodesSize() {
    const nodes = this.graph._nodes;
    for (let i = 0; i < nodes.length; ++i) {
        nodes[i].size = nodes[i].computeSize();
    }
    this.setDirty(true, true);
};

/**
     * resizes the canvas to a given size, if no size is passed, then it tries to fill the parentNode
     * @method resize
     **/
resize(width: undefined, height: undefined) {
    if (!width && !height) {
        const parent = this.canvas.parentNode;
        width = parent.offsetWidth;
        height = parent.offsetHeight;
    }

    if (this.canvas.width == width && this.canvas.height == height) {
        return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.bgcanvas.width = this.canvas.width;
    this.bgcanvas.height = this.canvas.height;
    this.setDirty(true, true);
};

/**
     * switches to live mode (node shapes are not rendered, only the content)
     * this feature was designed when graphs where meant to create user interfaces
     * @method switchLiveMode
     **/
switchLiveMode(transition: any) {
    if (!transition) {
        this.live_mode = !this.live_mode;
        this.dirty_canvas = true;
        this.dirty_bgcanvas = true;
        return;
    }

    const self = this;
    const delta = this.live_mode ? 1.1 : 0.9;
    if (this.live_mode) {
        this.live_mode = false;
        this.editor_alpha = 0.1;
    }

    var t = setInterval(function() {
        self.editor_alpha *= delta;
        self.dirty_canvas = true;
        self.dirty_bgcanvas = true;

        if (delta < 1 && self.editor_alpha < 0.01) {
            clearInterval(t);
            if (delta < 1) {
                self.live_mode = true;
            }
        }
        if (delta > 1 && self.editor_alpha > 0.99) {
            clearInterval(t);
            self.editor_alpha = 1;
        }
    }, 1);
};

onNodeSelectionChange(node: any) {
    return; // disabled
};

touchHandler(event: { changedTouches: any; type: any; preventDefault: () => void; }) {
    // alert("foo");
    let touches = event.changedTouches,
        first = touches[0],
        type = '';

    switch (event.type) {
        case 'touchstart':
            type = 'mousedown';
            break;
        case 'touchmove':
            type = 'mousemove';
            break;
        case 'touchend':
            type = 'mouseup';
            break;
        default:
            return;
    }

    // initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //           screenX, screenY, clientX, clientY, ctrlKey,
    //           altKey, shiftKey, metaKey, button, relatedTarget);

    const window = this.getCanvasWindow();
    const document = window.document;

    const simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(
            type,
            true,
            true,
            window,
            1,
            first.screenX,
            first.screenY,
            first.clientX,
            first.clientY,
            false,
            false,
            false,
            false,
            0 /* left*/,
            null
    );
    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
};


static DEFAULT_BACKGROUND_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=';

static link_type_colors = {
    '-1': LiteGraph.EVENT_LINK_COLOR,
    number: '#AAA',
    node: '#DCA',
};
static gradients = {}; // cache of gradients


static getFileExtension = function(url: string) {
    const question = url.indexOf('?');
    if (question != -1) {
        url = url.substr(0, question);
    }
    const point = url.lastIndexOf('.');
    if (point == -1) {
        return '';
    }
    return url.substr(point + 1).toLowerCase();
};

/* CONTEXT MENU ********************/

static onGroupAdd = function(info: any, entry: any, mouse_event: any) {
    const canvas = LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();

    const group = new LiteGraph.LGraphGroup();
    group.pos = canvas.convertEventToCanvasOffset(mouse_event);
    canvas.graph.add(group);
};

static onMenuAdd = function(node: any, options: any, e: any, prev_menu: any, callback: (arg0: any) => void) {

    const canvas = LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();
    const graph = canvas.graph;
    if (!graph)
    { return; }

    function inner_onMenuAdded(base_category: string, prev_menu: any) {

        const categories = LiteGraph.getNodeTypesCategories(canvas.filter || graph.filter).filter(function(category) { return category.startsWith(base_category); });
        const entries: { value: any; content: any; has_submenu: boolean; callback: ((value: any, event: any, mouseEvent: any, contextMenu: any) => void) | ((value: any, event: any, mouseEvent: any, contextMenu: any) => void); }[] = [];

        categories.map(function(category) {

            if (!category)
            { return; }

            const base_category_regex = new RegExp('^(' + base_category + ')');
            const category_name = category.replace(base_category_regex, '').split('/')[0];
            const category_path = base_category === '' ? category_name + '/' : base_category + category_name + '/';

            let name = category_name;
            if (name.indexOf('::') != -1) // in case it has a namespace like "shader::math/rand" it hides the namespace
            { name = name.split('::')[1]; }

            const index = entries.findIndex(function(entry) { return entry.value === category_path; });
            if (index === -1) {
                entries.push({ value: category_path, content: name, has_submenu: true, callback : function(value: { value: any; }, event: any, mouseEvent: any, contextMenu: any) {
                    inner_onMenuAdded(value.value, contextMenu);
                } });
            }

        });

        const nodes = LiteGraph.getNodeTypesInCategory(base_category.slice(0, -1), canvas.filter || graph.filter);
        nodes.map(function(node) {

            if (node.skip_list)
            { return; }

            const entry = { value: node.type, content: node.title, has_submenu: false, callback : function(value: { value: string; }, event: any, mouseEvent: any, contextMenu: { getFirstEvent: () => any; }) {

                const first_event = contextMenu.getFirstEvent();
                canvas.graph.beforeChange();
                const node = LiteGraph.createNode(value.value);
                if (node) {
                    node.pos = canvas.convertEventToCanvasOffset(first_event);
                    canvas.graph.add(node);
                }
                if (callback)
                { callback(node); }
                canvas.graph.afterChange();

            },
            };

            entries.push(entry);

        });

        new LiteGraph.ContextMenu(entries, { event: e, parentMenu: prev_menu }, ref_window);

    }

    inner_onMenuAdded('', prev_menu);
    return false;

};

static onMenuCollapseAll = function() {};

static onMenuNodeEdit = function() {};

static showMenuNodeOptionalInputs = function(
    v: any,
    options: string | any[],
    e: any,
    prev_menu: any,
    node: { optional_inputs: any; onGetInputs: () => any; graph: { beforeChange: () => void; afterChange: () => void; }; addInput: (arg0: any, arg1: any, arg2: any) => void; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }
) {
    if (!node) {
        return;
    }

    const that = this;
    const canvas = LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();

    var options = node.optional_inputs;
    if (node.onGetInputs) {
        options = node.onGetInputs();
    }

    let entries = [];
    if (options) {
        for (let i = 0; i < options.length; i++) {
            const entry = options[i];
            if (!entry) {
                entries.push(null);
                continue;
            }
            let label = entry[0];
            if (entry[2] && entry[2].label) {
                label = entry[2].label;
            }
            const data = { content: label, value: entry };
            if (entry[1] == LiteGraph.ACTION) {
                data.className = 'event';
            }
            entries.push(data);
        }
    }

    if (this.onMenuNodeInputs) {
        entries = this.onMenuNodeInputs(entries);
    }

    if (!entries.length) {
        console.log('no input entries');
        return;
    }

    const menu = new LiteGraph.ContextMenu(
            entries,
            {
                event: e,
                callback: inner_clicked,
                parentMenu: prev_menu,
                node: node,
            },
            ref_window
    );

    function inner_clicked(v: { callback: { call: (arg0: any, arg1: any, arg2: any, arg3: any, arg4: any) => void; }; value: any[]; }, e: any, prev: any) {
        if (!node) {
            return;
        }

        if (v.callback) {
            v.callback.call(that, node, v, e, prev);
        }

        if (v.value) {
            node.graph.beforeChange();
            node.addInput(v.value[0], v.value[1], v.value[2]);
            node.setDirtyCanvas(true, true);
            node.graph.afterChange();
        }
    }

    return false;
};

static showMenuNodeOptionalOutputs = function(
    v: any,
    options: string | any[],
    e: any,
    prev_menu: any,
    node: { optional_outputs: any; onGetOutputs: () => any; flags: { skip_repeated_outputs: any; }; findOutputSlot: (arg0: any) => number; graph: { beforeChange: () => void; afterChange: () => void; }; addOutput: (arg0: any, arg1: any, arg2: any) => void; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }
) {
    if (!node) {
        return;
    }

    const that = this;
    const canvas = LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();

    var options = node.optional_outputs;
    if (node.onGetOutputs) {
        options = node.onGetOutputs();
    }

    let entries = [];
    if (options) {
        for (let i = 0; i < options.length; i++) {
            const entry = options[i];
            if (!entry) {
                // separator?
                entries.push(null);
                continue;
            }

            if (
                node.flags &&
                    node.flags.skip_repeated_outputs &&
                    node.findOutputSlot(entry[0]) != -1
            ) {
                continue;
            } // skip the ones already on
            let label = entry[0];
            if (entry[2] && entry[2].label) {
                label = entry[2].label;
            }
            const data = { content: label, value: entry };
            if (entry[1] == LiteGraph.EVENT) {
                data.className = 'event';
            }
            entries.push(data);
        }
    }

    if (this.onMenuNodeOutputs) {
        entries = this.onMenuNodeOutputs(entries);
    }

    if (!entries.length) {
        return;
    }

    const menu = new LiteGraph.ContextMenu(
            entries,
            {
                event: e,
                callback: inner_clicked,
                parentMenu: prev_menu,
                node: node,
            },
            ref_window
    );

    function inner_clicked(v: { callback: { call: (arg0: any, arg1: any, arg2: any, arg3: any, arg4: any) => void; }; value: any[]; }, e: any, prev: any) {
        if (!node) {
            return;
        }

        if (v.callback) {
            v.callback.call(that, node, v, e, prev);
        }

        if (!v.value) {
            return;
        }

        const value = v.value[1];

        if (
            value &&
                (value.constructor === Object || value.constructor === Array)
        ) {
            // submenu why?
            const entries = [];
            for (const i in value) {
                entries.push({ content: i, value: value[i] });
            }
            new LiteGraph.ContextMenu(entries, {
                event: e,
                callback: inner_clicked,
                parentMenu: prev_menu,
                node: node,
            });
            return false;
        } else {
            node.graph.beforeChange();
            node.addOutput(v.value[0], v.value[1], v.value[2]);
            node.setDirtyCanvas(true, true);
            node.graph.afterChange();
        }
    }

    return false;
};

static onShowMenuNodeProperties = function(
    value: string | undefined,
    options: any,
    e: any,
    prev_menu: any,
    node: { properties: { [x: string]: any; }; getPropertyInfo: (arg0: string) => any; }
) {
    if (!node || !node.properties) {
        return;
    }

    const that = this;
    const canvas = LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();

    const entries = [];
    for (const i in node.properties) {
        var value = node.properties[i] !== undefined ? node.properties[i] : ' ';
        if (typeof value === 'object')
        { value = JSON.stringify(value); }
        const info = node.getPropertyInfo(i);
        if (info.type == 'enum' || info.type == 'combo')
        { value = LGraphCanvas.getPropertyPrintableValue(value, info.values); }

        // value could contain invalid html characters, clean that
        value = LGraphCanvas.decodeHTML(value);
        entries.push({
            content:
                    '<span class=\'property_name\'>' +
                    (info.label ? info.label : i) +
                    '</span>' +
                    '<span class=\'property_value\'>' +
                    value +
                    '</span>',
            value: i,
        });
    }
    if (!entries.length) {
        return;
    }

    const menu = new LiteGraph.ContextMenu(
            entries,
            {
                event: e,
                callback: inner_clicked,
                parentMenu: prev_menu,
                allow_html: true,
                node: node,
            },
            ref_window
    );

    function inner_clicked(v: { value: any; }, options: any, e: any, prev: any) {
        if (!node) {
            return;
        }
        const rect = this.getBoundingClientRect();
        canvas.showEditPropertyValue(node, v.value, {
            position: [rect.left, rect.top],
        });
    }

    return false;
};

static decodeHTML = function(str: string) {
    const e = document.createElement('div');
    e.innerText = str;
    return e.innerHTML;
};

static onResizeNode = function(value: any, options: any, e: any, menu: any, node: { size: any; computeSize: () => any; onResize: (arg0: any) => void; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }) {
    if (!node) {
        return;
    }
    node.size = node.computeSize();
    if (node.onResize)
    { node.onResize(node.size); }
    node.setDirtyCanvas(true, true);
};

showLinkMenu(link: never, e: any) {
    const that = this;
    console.log(link);
    const options = ['Add Node', null, 'Delete'];
    const menu = new LiteGraph.ContextMenu(options, {
        event: e,
        title: link.data != null ? link.data.constructor.name : null,
        callback: inner_clicked,
    });

    function inner_clicked(v: any, options: any, e: any) {
        switch (v) {
            case 'Add Node':
                LGraphCanvas.onMenuAdd(null, null, e, menu, function(node: { inputs: string | any[]; outputs: string | any[]; connect: (arg0: number, arg1: any, arg2: any) => void; pos: number[]; size: number[]; }) {
                    console.log('node autoconnect');
                    const node_left = that.graph.getNodeById(link.origin_id);
                    const node_right = that.graph.getNodeById(link.target_id);
                    if (!node.inputs || !node.inputs.length || !node.outputs || !node.outputs.length)
                    { return; }
                    if (node_left.outputs[ link.origin_slot ].type == node.inputs[0].type && node.outputs[0].type == node_right.inputs[0].type)
                    {
                        node_left.connect(link.origin_slot, node, 0);
                        node.connect(0, node_right, link.target_slot);
                        node.pos[0] -= node.size[0] * 0.5;
                    }
                });
                break;
            case 'Delete':
                that.graph.removeLink(link.id);
                break;
            default:
        }
    }

    return false;
};

static onShowPropertyEditor = function(item: { property: string; type: string; }, options: any, e: any, menu: any, node: { [x: string]: any; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }) {
    const input_html = '';
    const property = item.property || 'title';
    const value = node[property];

    const dialog = document.createElement('div');
    dialog.className = 'graphdialog';
    dialog.innerHTML = '<span class=\'name\'></span><input autofocus type=\'text\' class=\'value\'/><button>OK</button>';
    // dialog.innerHTML = "<span class='name'></span><textarea autofocus class='value'></textarea><button>OK</button>";
    const title = dialog.querySelector('.name');
    title.innerText = property;
    const input = dialog.querySelector('.value');
    if (input) {
        input.value = value;
        input.addEventListener('blur', function(e) {
            this.focus();
        });
        input.addEventListener('keydown', function(e) {
            if (e.keyCode != 13 && e.target.localName != 'textarea') {
                return;
            }
            inner();
            e.preventDefault();
            e.stopPropagation();
        });
    }

    const graphcanvas = LGraphCanvas.active_canvas;
    const canvas = graphcanvas.canvas;

    const rect = canvas.getBoundingClientRect();
    let offsetx = -20;
    let offsety = -20;
    if (rect) {
        offsetx -= rect.left;
        offsety -= rect.top;
    }

    if (event) {
        dialog.style.left = event.clientX + offsetx + 'px';
        dialog.style.top = event.clientY + offsety + 'px';
    } else {
        dialog.style.left = canvas.width * 0.5 + offsetx + 'px';
        dialog.style.top = canvas.height * 0.5 + offsety + 'px';
    }

    const button = dialog.querySelector('button');
    button.addEventListener('click', inner);
    canvas.parentNode.appendChild(dialog);

    function inner() {
        setValue(input.value);
    }

    function setValue(value: number | boolean) {
        if (item.type == 'Number') {
            value = Number(value);
        } else if (item.type == 'Boolean') {
            value = Boolean(value);
        }
        node[property] = value;
        if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
        node.setDirtyCanvas(true, true);
    }
};

prompt(title: string, value: any, callback: { (v: any): void; (v: any): void; (arg0: any): void; }, event: { clientX: number; clientY: number; }, multiline: undefined) {
    const that = this;
    const input_html = '';
    title = title || '';

    let modified = false;

    const dialog = document.createElement('div');
    dialog.className = 'graphdialog rounded';
    if (multiline)
	        { dialog.innerHTML = '<span class=\'name\'></span> <textarea autofocus class=\'value\'></textarea><button class=\'rounded\'>OK</button>'; }
    else
	        { dialog.innerHTML = '<span class=\'name\'></span> <input autofocus type=\'text\' class=\'value\'/><button class=\'rounded\'>OK</button>'; }
    dialog.close = function() {
        that.prompt_box = null;
        if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
    };

    if (this.ds.scale > 1) {
        dialog.style.transform = 'scale(' + this.ds.scale + ')';
    }

    dialog.addEventListener('mouseleave', function(e) {
        if (!modified) {
            dialog.close();
        }
    });

    if (that.prompt_box) {
        that.prompt_box.close();
    }
    that.prompt_box = dialog;

    const first = null;
    const timeout = null;
    const selected = null;

    const name_element = dialog.querySelector('.name');
    name_element.innerText = title;
    const value_element = dialog.querySelector('.value');
    value_element.value = value;

    const input = value_element;
    input.addEventListener('keydown', function(e) {
        modified = true;
        if (e.keyCode == 27) {
            // ESC
            dialog.close();
        } else if (e.keyCode == 13 && e.target.localName != 'textarea') {
            if (callback) {
                callback(this.value);
            }
            dialog.close();
        } else {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    });

    const button = dialog.querySelector('button');
    button.addEventListener('click', function(e) {
        if (callback) {
            callback(input.value);
        }
        that.setDirty(true);
        dialog.close();
    });

    const graphcanvas = LGraphCanvas.active_canvas;
    const canvas = graphcanvas.canvas;

    const rect = canvas.getBoundingClientRect();
    let offsetx = -20;
    let offsety = -20;
    if (rect) {
        offsetx -= rect.left;
        offsety -= rect.top;
    }

    if (event) {
        dialog.style.left = event.clientX + offsetx + 'px';
        dialog.style.top = event.clientY + offsety + 'px';
    } else {
        dialog.style.left = canvas.width * 0.5 + offsetx + 'px';
        dialog.style.top = canvas.height * 0.5 + offsety + 'px';
    }

    canvas.parentNode.appendChild(dialog);
    setTimeout(function() {
        input.focus();
    }, 10);

    return dialog;
};

static search_limit = -1;
showSearchBox(event: { clientX: any; clientY: any; layerY: number; }) {
    const that = this;
    const input_html = '';
    const graphcanvas = LGraphCanvas.active_canvas;
    const canvas = graphcanvas.canvas;
    const root_document = canvas.ownerDocument || document;

    const dialog = document.createElement('div');
    dialog.className = 'litegraph litesearchbox graphdialog rounded';
    dialog.innerHTML =
            '<span class=\'name\'>Search</span> <input autofocus type=\'text\' class=\'value rounded\'/><div class=\'helper\'></div>';
    dialog.close = function() {
        that.search_box = null;
        root_document.body.focus();
        root_document.body.style.overflow = '';

        setTimeout(function() {
            that.canvas.focus();
        }, 20); // important, if canvas loses focus keys wont be captured
        if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
    };

    let timeout_close: number | null | undefined = null;

    if (this.ds.scale > 1) {
        dialog.style.transform = 'scale(' + this.ds.scale + ')';
    }

    dialog.addEventListener('mouseenter', function(e) {
        if (timeout_close) {
            clearTimeout(timeout_close);
            timeout_close = null;
        }
    });

    dialog.addEventListener('mouseleave', function(e) {
        // dialog.close();
        timeout_close = setTimeout(function() {
            dialog.close();
        }, 500);
    });

    if (that.search_box) {
        that.search_box.close();
    }
    that.search_box = dialog;

    const helper = dialog.querySelector('.helper');

    let first: null = null;
    let timeout: number | null | undefined = null;
    let selected: ChildNode | null = null;

    const input = dialog.querySelector('input');
    if (input) {
        input.addEventListener('blur', function(e) {
            this.focus();
        });
        input.addEventListener('keydown', function(e) {
            if (e.keyCode == 38) {
                // UP
                changeSelection(false);
            } else if (e.keyCode == 40) {
                // DOWN
                changeSelection(true);
            } else if (e.keyCode == 27) {
                // ESC
                dialog.close();
            } else if (e.keyCode == 13) {
                if (selected) {
                    select(selected.innerHTML);
                } else if (first) {
                    select(first);
                } else {
                    dialog.close();
                }
            } else {
                if (timeout) {
                    clearInterval(timeout);
                }
                timeout = setTimeout(refreshHelper, 10);
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return true;
        });
    }

    if (root_document.fullscreenElement)
	        { root_document.fullscreenElement.appendChild(dialog); }
    else
    {
		    root_document.body.appendChild(dialog);
        root_document.body.style.overflow = 'hidden';
    }

    // compute best position
    const rect = canvas.getBoundingClientRect();

    const left = (event ? event.clientX : (rect.left + rect.width * 0.5)) - 80;
    const top = (event ? event.clientY : (rect.top + rect.height * 0.5)) - 20;
    dialog.style.left = left + 'px';
    dialog.style.top = top + 'px';

    // To avoid out of screen problems
    if (event.layerY > (rect.height - 200))
    { helper.style.maxHeight = (rect.height - event.layerY - 20) + 'px'; }

    /*
        var offsetx = -20;
        var offsety = -20;
        if (rect) {
            offsetx -= rect.left;
            offsety -= rect.top;
        }

        if (event) {
            dialog.style.left = event.clientX + offsetx + "px";
            dialog.style.top = event.clientY + offsety + "px";
        } else {
            dialog.style.left = canvas.width * 0.5 + offsetx + "px";
            dialog.style.top = canvas.height * 0.5 + offsety + "px";
        }
        canvas.parentNode.appendChild(dialog);
		*/

    input.focus();

    function select(name: string) {
        if (name) {
            if (that.onSearchBoxSelection) {
                that.onSearchBoxSelection(name, event, graphcanvas);
            } else {
                const extra = LiteGraph.searchbox_extras[name.toLowerCase()];
                if (extra) {
                    name = extra.type;
                }

                graphcanvas.graph.beforeChange();
                const node = LiteGraph.createNode(name);
                if (node) {
                    node.pos = graphcanvas.convertEventToCanvasOffset(
                            event
                    );
                    graphcanvas.graph.add(node);
                }

                if (extra && extra.data) {
                    if (extra.data.properties) {
                        for (var i in extra.data.properties) {
                            node.addProperty(i, extra.data.properties[i]);
                        }
                    }
                    if (extra.data.inputs) {
                        node.inputs = [];
                        for (var i in extra.data.inputs) {
                            node.addOutput(
                                    extra.data.inputs[i][0],
                                    extra.data.inputs[i][1]
                            );
                        }
                    }
                    if (extra.data.outputs) {
                        node.outputs = [];
                        for (var i in extra.data.outputs) {
                            node.addOutput(
                                    extra.data.outputs[i][0],
                                    extra.data.outputs[i][1]
                            );
                        }
                    }
                    if (extra.data.title) {
                        node.title = extra.data.title;
                    }
                    if (extra.data.json) {
                        node.configure(extra.data.json);
                    }

                    graphcanvas.graph.afterChange();
                }
            }
        }

        dialog.close();
    }

    function changeSelection(forward: boolean) {
        const prev = selected;
        if (selected) {
            selected.classList.remove('selected');
        }
        if (!selected) {
            selected = forward
                ? helper.childNodes[0]
                : helper.childNodes[helper.childNodes.length];
        } else {
            selected = forward
                ? selected.nextSibling
                : selected.previousSibling;
            if (!selected) {
                selected = prev;
            }
        }
        if (!selected) {
            return;
        }
        selected.classList.add('selected');
        selected.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }

    function refreshHelper() {
        timeout = null;
        let str = input.value;
        first = null;
        helper.innerHTML = '';
        if (!str) {
            return;
        }

        if (that.onSearchBox) {
            const list = that.onSearchBox(helper, str, graphcanvas);
            if (list) {
                for (var i = 0; i < list.length; ++i) {
                    addResult(list[i]);
                }
            }
        } else {
            let c = 0;
            str = str.toLowerCase();
            const filter = graphcanvas.filter || graphcanvas.graph.filter;

            // extras
            for (var i in LiteGraph.searchbox_extras) {
                const extra = LiteGraph.searchbox_extras[i];
                if (extra.desc.toLowerCase().indexOf(str) === -1) {
                    continue;
                }
                const ctor = LiteGraph.registered_node_types[ extra.type ];
                if (ctor && ctor.filter != filter)
                { continue; }
                addResult(extra.desc, 'searchbox_extra');
                if (LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit) {
                    break;
                }
            }

            var filtered = null;
            if (Array.prototype.filter) { // filter supported
                const keys = Object.keys(LiteGraph.registered_node_types); // types
                var filtered = keys.filter(inner_test_filter);
            } else {
                filtered = [];
                for (var i in LiteGraph.registered_node_types) {
                    if (inner_test_filter(i))
                    { filtered.push(i); }
                }
            }

            for (var i = 0; i < filtered.length; i++) {
                addResult(filtered[i]);
                if (LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit) {
                    break;
                }
            }

            function inner_test_filter(type: string | number)
            {
                const ctor = LiteGraph.registered_node_types[ type ];
                if (filter && ctor.filter != filter)
                { return false; }
                return type.toLowerCase().indexOf(str) !== -1;
            }
        }

        function addResult(type: string, className: string | undefined) {
            const help = document.createElement('div');
            if (!first) {
                first = type;
            }
            help.innerText = type;
            help.dataset['type'] = escape(type);
            help.className = 'litegraph lite-search-item';
            if (className) {
                help.className += ' ' + className;
            }
            help.addEventListener('click', function(e) {
                select(unescape(this.dataset['type']));
            });
            helper.appendChild(help);
        }
    }

    return dialog;
};

showEditPropertyValue(node: { properties: { [x: string]: any; }; getPropertyInfo: (arg0: any) => any; graph: { _version: number; }; onPropertyChanged: (arg0: any, arg1: any) => void; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }, property: string | number, options: { onclose?: any; }) {
    if (!node || node.properties[property] === undefined) {
        return;
    }

    options = options || {};
    const that = this;

    const info = node.getPropertyInfo(property);
    const type = info.type;

    let input_html = '';

    if (type == 'string' || type == 'number' || type == 'array' || type == 'object') {
        input_html = '<input autofocus type=\'text\' class=\'value\'/>';
    } else if ((type == 'enum' || type == 'combo') && info.values) {
        input_html = '<select autofocus type=\'text\' class=\'value\'>';
        for (const i in info.values) {
            var v = i;
            if (info.values.constructor === Array)
            { v = info.values[i]; }

            input_html +=
                    '<option value=\'' +
                    v +
                    '\' ' +
                    (v == node.properties[property] ? 'selected' : '') +
                    '>' +
                    info.values[i] +
                    '</option>';
        }
        input_html += '</select>';
    } else if (type == 'boolean') {
        input_html =
                '<input autofocus type=\'checkbox\' class=\'value\' ' +
                (node.properties[property] ? 'checked' : '') +
                '/>';
    } else {
        console.warn('unknown type: ' + type);
        return;
    }

    const dialog = this.createDialog(
            '<span class=\'name\'>' +
                (info.label ? info.label : property) +
                '</span>' +
                input_html +
                '<button>OK</button>',
            options
    );

    if ((type == 'enum' || type == 'combo') && info.values) {
        var input = dialog.querySelector('select');
        input.addEventListener('change', function(e) {
            setValue(e.target.value);
            // var index = e.target.value;
            // setValue( e.options[e.selectedIndex].value );
        });
    } else if (type == 'boolean') {
        var input = dialog.querySelector('input');
        if (input) {
            input.addEventListener('click', function(e) {
                setValue(!!input.checked);
            });
        }
    } else {
        var input = dialog.querySelector('input');
        if (input) {
            input.addEventListener('blur', function(e) {
                this.focus();
            });

            var v = node.properties[property] !== undefined ? node.properties[property] : '';
            if (type !== 'string') {
                v = JSON.stringify(v);
            }

            input.value = v;
            input.addEventListener('keydown', function(e) {
                if (e.keyCode != 13) {
                    return;
                }
                inner();
                e.preventDefault();
                e.stopPropagation();
            });
        }
    }

    const button = dialog.querySelector('button');
    button.addEventListener('click', inner);

    function inner() {
        setValue(input.value);
    }

    function setValue(value: string | number | boolean) {

        if (info && info.values && info.values.constructor === Object && info.values[value] != undefined)
        { value = info.values[value]; }

        if (typeof node.properties[property] === 'number') {
            value = Number(value);
        }
        if (type == 'array' || type == 'object') {
            value = JSON.parse(value);
        }
        node.properties[property] = value;
        if (node.graph) {
            node.graph._version++;
        }
        if (node.onPropertyChanged) {
            node.onPropertyChanged(property, value);
        }
        if (options.onclose)
        { options.onclose(); }
        dialog.close();
        node.setDirtyCanvas(true, true);
    }

    return dialog;
};

createDialog(html: string, options: { position?: any; event?: any; }) {
    options = options || {};

    const dialog = document.createElement('div');
    dialog.className = 'graphdialog';
    dialog.innerHTML = html;

    const rect = this.canvas.getBoundingClientRect();
    let offsetx = -20;
    let offsety = -20;
    if (rect) {
        offsetx -= rect.left;
        offsety -= rect.top;
    }

    if (options.position) {
        offsetx += options.position[0];
        offsety += options.position[1];
    } else if (options.event) {
        offsetx += options.event.clientX;
        offsety += options.event.clientY;
    } // centered
    else {
        offsetx += this.canvas.width * 0.5;
        offsety += this.canvas.height * 0.5;
    }

    dialog.style.left = offsetx + 'px';
    dialog.style.top = offsety + 'px';

    this.canvas.parentNode.appendChild(dialog);

    dialog.close = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };

    return dialog;
};

createPanel(title: string, options: { closable?: any; window?: any; width?: any; height?: any; }) {
    options = options || {};

    const ref_window = options.window || window;
    const root = document.createElement('div');
    root.className = 'litegraph dialog';
    root.innerHTML = '<div class=\'dialog-header\'><span class=\'dialog-title\'></span></div><div class=\'dialog-content\'></div><div class=\'dialog-footer\'></div>';
    root.header = root.querySelector('.dialog-header');

    if (options.width)
    { root.style.width = options.width + (options.width.constructor === Number ? 'px' : ''); }
    if (options.height)
    { root.style.height = options.height + (options.height.constructor === Number ? 'px' : ''); }
    if (options.closable)
    {
        const close = document.createElement('span');
        close.innerHTML = '&#10005;';
        close.classList.add('close');
        close.addEventListener('click', function() {
            root.close();
        });
        root.header.appendChild(close);
    }
    root.title_element = root.querySelector('.dialog-title');
    root.title_element.innerText = title;
    root.content = root.querySelector('.dialog-content');
    root.footer = root.querySelector('.dialog-footer');

    root.close = function()
    {
        this.parentNode.removeChild(this);
    };

    root.clear = function()
    {
        this.content.innerHTML = '';
    };

    root.addHTML = function(code, classname, on_footer)
    {
        const elem = document.createElement('div');
        if (classname)
        { elem.className = classname; }
        elem.innerHTML = code;
        if (on_footer)
        { root.footer.appendChild(elem); }
        else
        { root.content.appendChild(elem); }
        return elem;
    };

    root.addButton = function(name, callback, options)
    {
        const elem = document.createElement('button');
        elem.innerText = name;
        elem.options = options;
        elem.classList.add('btn');
        elem.addEventListener('click', callback);
        root.footer.appendChild(elem);
        return elem;
    };

    root.addSeparator = function()
    {
        const elem = document.createElement('div');
        elem.className = 'separator';
        root.content.appendChild(elem);
    };

    root.addWidget = function(type, name, value, options, callback)
    {
        options = options || {};
        var str_value = String(value);
        type = type.toLowerCase();
        if (type == 'number')
        { str_value = value.toFixed(3); }

        const elem = document.createElement('div');
        elem.className = 'property';
        elem.innerHTML = '<span class=\'property_name\'></span><span class=\'property_value\'></span>';
        elem.querySelector('.property_name').innerText = name;
        const value_element = elem.querySelector('.property_value');
        value_element.innerText = str_value;
        elem.dataset['property'] = name;
        elem.dataset['type'] = options.type || type;
        elem.options = options;
        elem.value = value;

        // if( type == "code" )
        //	elem.addEventListener("click", function(){ inner_showCodePad( node, this.dataset["property"] ); });
        if (type == 'boolean')
        {
            elem.classList.add('boolean');
            if (value)
            { elem.classList.add('bool-on'); }
            elem.addEventListener('click', function() {
                // var v = node.properties[this.dataset["property"]]; 
                // node.setProperty(this.dataset["property"],!v); this.innerText = v ? "true" : "false"; 
                const propname = this.dataset['property'];
                this.value = !this.value;
                this.classList.toggle('bool-on');
                this.querySelector('.property_value').innerText = this.value ? 'true' : 'false';
                innerChange(propname, this.value);
            });
        }
        else if (type == 'string' || type == 'number')
        {
            value_element.setAttribute('contenteditable', true);
            value_element.addEventListener('keydown', function(e) {
                if (e.code == 'Enter')
                {
                    e.preventDefault();
                    this.blur();
                }
            });
            value_element.addEventListener('blur', function() {
                let v = this.innerText;
                const propname = this.parentNode.dataset['property'];
                const proptype = this.parentNode.dataset['type'];
                if (proptype == 'number')
                { v = Number(v); }
                innerChange(propname, v);
            });
        }
        else if (type == 'enum' || type == 'combo')
        { var str_value = LGraphCanvas.getPropertyPrintableValue(value, options.values); }
        value_element.innerText = str_value;

        value_element.addEventListener('click', function(event) {
            const values = options.values || [];
            const propname = this.parentNode.dataset['property'];
            const elem_that = this;
            const menu = new LiteGraph.ContextMenu(values, {
                event: event,
                className: 'dark',
                callback: inner_clicked,
            },
						ref_window);
            function inner_clicked(v: any, option: any, event: any) {
                // node.setProperty(propname,v); 
                // graphcanvas.dirty_canvas = true;
                elem_that.innerText = v;
                innerChange(propname, v);
                return false;
            }
        });

        root.content.appendChild(elem);

        function innerChange(name: string | undefined, value: any)
        {
            console.log('change', name, value);
            // that.dirty_canvas = true;
            if (options.callback)
            { options.callback(name, value); }
            if (callback)
            { callback(name, value); }
        }

        return elem;
    };

    return root;
};

static getPropertyPrintableValue = function(value: any, values: { [x: string]: any; constructor: ArrayConstructor | ObjectConstructor; })
{
    if (!values)
    { return String(value); }

    if (values.constructor === Array)
    {
        return String(value);
    }

    if (values.constructor === Object)
    {
        let desc_value = '';
        for (const k in values)
        {
            if (values[k] != value)
            { continue; }
            desc_value = k;
            break;
        }
        return String(value) + ' (' + desc_value + ')';
    }
};

showShowNodePanel(node: { title: any; type: string; constructor: { desc: any; }; properties: { [x: string]: any; }; getPropertyInfo: (arg0: string) => any; onAddPropertyToPanel: (arg0: string, arg1: Element | null) => any; setProperty: (arg0: any, arg1: any) => void; onShowCustomPanelInfo: (arg0: Element | null) => void; block_delete: any; graph: { remove: (arg0: any) => void; }; })
{
    window.SELECTED_NODE = node;
    let panel = document.querySelector('#node-panel');
    if (panel)
    { panel.close(); }
    const ref_window = this.getCanvasWindow();
    panel = this.createPanel(node.title || '', { closable: true, window: ref_window });
    panel.id = 'node-panel';
    panel.node = node;
    panel.classList.add('settings');
    const that = this;
    const graphcanvas = this;

    function inner_refresh()
    {
        panel.content.innerHTML = ''; // clear
        panel.addHTML('<span class=\'node_type\'>' + node.type + '</span><span class=\'node_desc\'>' + (node.constructor.desc || '') + '</span><span class=\'separator\'></span>');

        panel.addHTML('<h3>Properties</h3>');

        for (const i in node.properties)
        {
            const value = node.properties[i];
            const info = node.getPropertyInfo(i);
            const type = info.type || 'string';

            // in case the user wants control over the side panel widget
            if (node.onAddPropertyToPanel && node.onAddPropertyToPanel(i, panel))
            { continue; }

            panel.addWidget(info.widget || info.type, i, value, info, function(name: any, value: any) {
                graphcanvas.graph.beforeChange(node);
                node.setProperty(name, value);
                graphcanvas.graph.afterChange();
                graphcanvas.dirty_canvas = true;
            });
        }

        panel.addSeparator();

        if (node.onShowCustomPanelInfo)
        { node.onShowCustomPanelInfo(panel); }

        /*
			panel.addHTML("<h3>Connections</h3>");
			var connection_containers = panel.addHTML("<div class='inputs connections_side'></div><div class='outputs connections_side'></div>","connections");
			var inputs = connection_containers.querySelector(".inputs");
			var outputs = connection_containers.querySelector(".outputs");
			*/

        panel.addButton('Delete', function() {
            if (node.block_delete)
            { return; }
            node.graph.remove(node);
            panel.close();
        }).classList.add('delete');
    }

    function inner_showCodePad(node: { properties: { [x: string]: any; }; setProperty: (arg0: any, arg1: any) => void; }, propname: string | number)
    {
        panel.style.top = 'calc( 50% - 250px)';
        panel.style.left = 'calc( 50% - 400px)';
        panel.style.width = '800px';
        panel.style.height = '500px';

        if (window.CodeFlask) // disabled for now
        {
            panel.content.innerHTML = '<div class=\'code\'></div>';
            const flask = new CodeFlask('div.code', { language: 'js' });
            flask.updateCode(node.properties[propname]);
            flask.onUpdate(function(code: any) {
                node.setProperty(propname, code);
            });
        }
        else
        {
            panel.content.innerHTML = '<textarea class=\'code\'></textarea>';
            var textarea = panel.content.querySelector('textarea');
            textarea.value = node.properties[propname];
            textarea.addEventListener('keydown', function(e: { code: string; ctrlKey: any; }) {
                // console.log(e);
                if (e.code == 'Enter' && e.ctrlKey)
                {
                    console.log('Assigned');
                    node.setProperty(propname, textarea.value);
                }
            });
            textarea.style.height = 'calc(100% - 40px)';
        }
        const assign = that.createButton('Assign', null, function() {
            node.setProperty(propname, textarea.value);
        });
        panel.content.appendChild(assign);
        const button = that.createButton('Close', null, function() {
            panel.style.height = '';
            inner_refresh();
        });
        button.style.float = 'right';
        panel.content.appendChild(button);
    }

    inner_refresh();

    this.canvas.parentNode.appendChild(panel);
}createButton(arg0: string, arg1: null, arg2: () => void) {
        throw new Error("Method not implemented.");
    }
;

showSubgraphPropertiesDialog(node: { inputs: string | any[]; removeInput: (arg0: number) => void; findInputSlot: (arg0: any) => number; addInput: (arg0: any, arg1: any) => void; })
{
    console.log('showing subgraph properties dialog');

    const old_panel = this.canvas.parentNode.querySelector('.subgraph_dialog');
    if (old_panel)
    { old_panel.close(); }

    const panel = this.createPanel('Subgraph Inputs', { closable:true, width: 500 });
    panel.node = node;
    panel.classList.add('subgraph_dialog');

    function inner_refresh()
    {
        panel.clear();

        // show currents
        if (node.inputs)
        { for (let i = 0; i < node.inputs.length; ++i)
        {
            const input = node.inputs[i];
            if (input.not_subgraph_input)
            { continue; }
            const html = '<button>&#10005;</button> <span class=\'bullet_icon\'></span><span class=\'name\'></span><span class=\'type\'></span>';
            const elem = panel.addHTML(html, 'subgraph_property');
            elem.dataset['name'] = input.name;
            elem.dataset['slot'] = i;
            elem.querySelector('.name').innerText = input.name;
            elem.querySelector('.type').innerText = input.type;
            elem.querySelector('button').addEventListener('click', function(e) {
                node.removeInput(Number(this.parentNode.dataset['slot']));
                inner_refresh();
            });
        } }
    }

    // add extra
    const html = ' + <span class=\'label\'>Name</span><input class=\'name\'/><span class=\'label\'>Type</span><input class=\'type\'></input><button>+</button>';
    const elem = panel.addHTML(html, 'subgraph_property extra', true);
    elem.querySelector('button').addEventListener('click', function(e) {
        const elem = this.parentNode;
        const name = elem.querySelector('.name').value;
        const type = elem.querySelector('.type').value;
        if (!name || node.findInputSlot(name) != -1)
        { return; }
        node.addInput(name, type);
        elem.querySelector('.name').value = '';
        elem.querySelector('.type').value = '';
        inner_refresh();
    });

    inner_refresh();
	    this.canvas.parentNode.appendChild(panel);
    return panel;
};

checkPanels()
{
    if (!this.canvas)
    { return; }
    const panels = this.canvas.parentNode.querySelectorAll('.litegraph.dialog');
    for (let i = 0; i < panels.length; ++i)
    {
        const panel = panels[i];
        if (!panel.node)
        { continue; }
        if (!panel.node.graph || panel.graph != this.graph)
        { panel.close(); }
    }
};

static onMenuNodeCollapse = function(value: any, options: any, e: any, menu: any, node: { graph: { beforeChange: (arg0: any) => void; afterChange: (arg0: any) => void; }; collapse: () => void; }) {
    node.graph.beforeChange(node);
    node.collapse();
    node.graph.afterChange(node);
};

static onMenuNodePin = function(value: any, options: any, e: any, menu: any, node: { pin: () => void; }) {
    node.pin();
};

static onMenuNodeMode = function(value: any, options: any, e: any, menu: any, node: { mode: number; }) {
    new LiteGraph.ContextMenu(
            ['Always', 'On Event', 'On Trigger', 'Never'],
            { event: e, callback: inner_clicked, parentMenu: menu, node: node }
    );

    function inner_clicked(v: any) {
        if (!node) {
            return;
        }
        switch (v) {
            case 'On Event':
                node.mode = LiteGraph.ON_EVENT;
                break;
            case 'On Trigger':
                node.mode = LiteGraph.ON_TRIGGER;
                break;
            case 'Never':
                node.mode = LiteGraph.NEVER;
                break;
            case 'Always':
            default:
                node.mode = LiteGraph.ALWAYS;
                break;
        }
    }

    return false;
};

static onMenuNodeColors = function(value: { value: string; content: string; }, options: any, e: any, menu: any, node: { constructor: any; color: any; bgcolor: any; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }) {
    if (!node) {
        throw 'no node for color';
    }

    const values = [];
    values.push({
        value: null,
        content:
                '<span style=\'display: block; padding-left: 4px;\'>No color</span>',
    });

    for (const i in LGraphCanvas.node_colors) {
        const color = LGraphCanvas.node_colors[i];
        var value = {
            value: i,
            content:
                    '<span style=\'display: block; color: #999; padding-left: 4px; border-left: 8px solid ' +
                    color.color +
                    '; background-color:' +
                    color.bgcolor +
                    '\'>' +
                    i +
                    '</span>',
        };
        values.push(value);
    }
    new LiteGraph.ContextMenu(values, {
        event: e,
        callback: inner_clicked,
        parentMenu: menu,
        node: node,
    });

    function inner_clicked(v: { value: any; }) {
        if (!node) {
            return;
        }

        const color = v.value ? static node_colors: any[v.value] : null;
        if (color) {
            if (node.constructor === LiteGraph.LGraphGroup) {
                node.color = color.groupcolor;
            } else {
                node.color = color.color;
                node.bgcolor = color.bgcolor;
            }
        } else {
            delete node.color;
            delete node.bgcolor;
        }
        node.setDirtyCanvas(true, true);
    }

    return false;
};

static onMenuNodeShapes = function(value: any, options: any, e: any, menu: any, node: { graph: { beforeChange: (arg0: any) => void; afterChange: (arg0: any) => void; }; shape: any; setDirtyCanvas: (arg0: boolean) => void; }) {
    if (!node) {
        throw 'no node passed';
    }

    new LiteGraph.ContextMenu(LiteGraph.VALID_SHAPES, {
        event: e,
        callback: inner_clicked,
        parentMenu: menu,
        node: node,
    });

    function inner_clicked(v: any) {
        if (!node) {
            return;
        }
        node.graph.beforeChange(node);
        node.shape = v;
        node.graph.afterChange(node);
        node.setDirtyCanvas(true);
    }

    return false;
};

static onMenuNodeRemove = function(value: any, options: any, e: any, menu: any, node: { removable: boolean; graph: any; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }) {
    if (!node) {
        throw 'no node passed';
    }

    if (node.removable === false) {
        return;
    }

    const graph = node.graph;
    graph.beforeChange();
    graph.remove(node);
    graph.afterChange();
    node.setDirtyCanvas(true, true);
};

static onMenuNodeToSubgraph = function(value: any, options: any, e: any, menu: any, node: unknown) {
    const graph = node.graph;
    const graphcanvas = LGraphCanvas.active_canvas;
    if (!graphcanvas) // ??
    { return; }

    let nodes_list = Object.values(graphcanvas.selected_nodes || {});
    if (!nodes_list.length)
    { nodes_list = [node]; }

    const subgraph_node = LiteGraph.createNode('graph/subgraph');
    subgraph_node.pos = node.pos.concat();
    graph.add(subgraph_node);

    subgraph_node.buildFromNodes(nodes_list);

    graphcanvas.deselectAllNodes();
    node.setDirtyCanvas(true, true);
};

static onMenuNodeClone = function(value: any, options: any, e: any, menu: any, node: { clonable: boolean; clone: () => any; pos: number[]; graph: { beforeChange: () => void; add: (arg0: any) => void; afterChange: () => void; }; setDirtyCanvas: (arg0: boolean, arg1: boolean) => void; }) {
    if (node.clonable == false) {
        return;
    }
    const newnode = node.clone();
    if (!newnode) {
        return;
    }
    newnode.pos = [node.pos[0] + 5, node.pos[1] + 5];

    node.graph.beforeChange();
    node.graph.add(newnode);
    node.graph.afterChange();

    node.setDirtyCanvas(true, true);
};

static node_colors = {
    red: { color: '#322', bgcolor: '#533', groupcolor: '#A88' },
    brown: { color: '#332922', bgcolor: '#593930', groupcolor: '#b06634' },
    green: { color: '#232', bgcolor: '#353', groupcolor: '#8A8' },
    blue: { color: '#223', bgcolor: '#335', groupcolor: '#88A' },
    pale_blue: {
        color: '#2a363b',
        bgcolor: '#3f5159',
        groupcolor: '#3f789e',
    },
    cyan: { color: '#233', bgcolor: '#355', groupcolor: '#8AA' },
    purple: { color: '#323', bgcolor: '#535', groupcolor: '#a1309b' },
    yellow: { color: '#432', bgcolor: '#653', groupcolor: '#b58b2a' },
    black: { color: '#222', bgcolor: '#000', groupcolor: '#444' },
};

getCanvasMenuOptions() {
    let options = null;
    if (this.getMenuOptions) {
        options = this.getMenuOptions();
    } else {
        options = [
            {
                content: 'Add Node',
                has_submenu: true,
                callback: LGraphCanvas.onMenuAdd,
            },
            { content: 'Add Group', callback: LGraphCanvas.onGroupAdd },
            // {content:"Collapse All", callback: LGraphCanvas.onMenuCollapseAll }
        ];

        if (this._graph_stack && this._graph_stack.length > 0) {
            options.push(null, {
                content: 'Close subgraph',
                callback: this.closeSubgraph.bind(this),
            });
        }
    }

    if (this.getExtraMenuOptions) {
        const extra = this.getExtraMenuOptions(this, options);
        if (extra) {
            options = options.concat(extra);
        }
    }

    return options;
};

// called by processContextMenu to extract the menu list
getNodeMenuOptions(node) {
    let options = null;

    if (node.getMenuOptions) {
        options = node.getMenuOptions(this);
    } else {
        options = [
            {
                content: 'Inputs',
                has_submenu: true,
                disabled: true,
                callback: LGraphCanvas.showMenuNodeOptionalInputs,
            },
            {
                content: 'Outputs',
                has_submenu: true,
                disabled: true,
                callback: LGraphCanvas.showMenuNodeOptionalOutputs,
            },
            null,
            {
                content: 'Properties',
                has_submenu: true,
                callback: LGraphCanvas.onShowMenuNodeProperties,
            },
            null,
            {
                content: 'Title',
                callback: LGraphCanvas.onShowPropertyEditor,
            },
            {
                content: 'Mode',
                has_submenu: true,
                callback: LGraphCanvas.onMenuNodeMode,
            },
            {
                content: 'Resize', callback: function() {
                    if (node.resizable)
                    { return LGraphCanvas.onResizeNode; }
                },
            },
            {
                content: 'Collapse',
                callback: LGraphCanvas.onMenuNodeCollapse,
            },
            { content: 'Pin', callback: LGraphCanvas.onMenuNodePin },
            {
                content: 'Colors',
                has_submenu: true,
                callback: LGraphCanvas.onMenuNodeColors,
            },
            {
                content: 'Shapes',
                has_submenu: true,
                callback: LGraphCanvas.onMenuNodeShapes,
            },
            null,
        ];
    }

    if (node.onGetInputs) {
        const inputs = node.onGetInputs();
        if (inputs && inputs.length) {
            options[0].disabled = false;
        }
    }

    if (node.onGetOutputs) {
        const outputs = node.onGetOutputs();
        if (outputs && outputs.length) {
            options[1].disabled = false;
        }
    }

    if (node.getExtraMenuOptions) {
        const extra = node.getExtraMenuOptions(this, options);
        if (extra) {
            extra.push(null);
            options = extra.concat(options);
        }
    }

    if (node.clonable !== false) {
        options.push({
            content: 'Clone',
            callback: LGraphCanvas.onMenuNodeClone,
        });
    }

    if (0) // TODO
    { options.push({
        content: 'To Subgraph',
        callback: LGraphCanvas.onMenuNodeToSubgraph,
    }); }

    options.push(null, {
        content: 'Remove',
        disabled: !(node.removable !== false && !node.block_delete),
        callback: LGraphCanvas.onMenuNodeRemove,
    });

    if (node.graph && node.graph.onGetNodeMenuOptions) {
        node.graph.onGetNodeMenuOptions(options, node);
    }

    return options;
};

getGroupMenuOptions(node: any) {
    const o = [
        { content: 'Title', callback: LGraphCanvas.onShowPropertyEditor },
        {
            content: 'Color',
            has_submenu: true,
            callback: LGraphCanvas.onMenuNodeColors,
        },
        {
            content: 'Font size',
            property: 'font_size',
            type: 'Number',
            callback: LGraphCanvas.onShowPropertyEditor,
        },
        null,
        { content: 'Remove', callback: LGraphCanvas.onMenuNodeRemove },
    ];

    return o;
};

processContextMenu(node: { type: any; getSlotInPosition: (arg0: any, arg1: any) => any; getSlotMenuOptions: (arg0: any) => any; removeInput: (arg0: any) => void; removeOutput: (arg0: any) => void; disconnectOutput: (arg0: any) => void; disconnectInput: (arg0: any) => void; getInputInfo: (arg0: any) => any; getOutputInfo: (arg0: any) => any; }, event: { canvasX: any; canvasY: any; }) {
    const that = this;
    const canvas = LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();

    let menu_info = null;
    const options = {
        event: event,
        callback: inner_option_clicked,
        extra: node,
    };

    if (node)
    { options.title = node.type; }

    // check if mouse is in input
    let slot = null;
    if (node) {
        slot = node.getSlotInPosition(event.canvasX, event.canvasY);
        LGraphCanvas.active_node = node;
    }

    if (slot) {
        // on slot
        menu_info = [];
        if (node.getSlotMenuOptions) {
            menu_info = node.getSlotMenuOptions(slot);
        } else {
            if (
                slot &&
                    slot.output &&
                    slot.output.links &&
                    slot.output.links.length
            ) {
                menu_info.push({ content: 'Disconnect Links', slot: slot });
            }
            const _slot = slot.input || slot.output;
            menu_info.push(
                    _slot.locked
                        ? 'Cannot remove'
                        : { content: 'Remove Slot', slot: slot }
            );
            menu_info.push(
                    _slot.nameLocked
                        ? 'Cannot rename'
                        : { content: 'Rename Slot', slot: slot }
            );

        }
        options.title =
                (slot.input ? slot.input.type : slot.output.type) || '*';
        if (slot.input && slot.input.type == LiteGraph.ACTION) {
            options.title = 'Action';
        }
        if (slot.output && slot.output.type == LiteGraph.EVENT) {
            options.title = 'Event';
        }
    } else {
        if (node) {
            // on node
            menu_info = this.getNodeMenuOptions(node);
        } else {
            menu_info = this.getCanvasMenuOptions();
            const group = this.graph.getGroupOnPos(
                    event.canvasX,
                    event.canvasY
            );
            if (group) {
                // on group
                menu_info.push(null, {
                    content: 'Edit Group',
                    has_submenu: true,
                    submenu: {
                        title: 'Group',
                        extra: group,
                        options: this.getGroupMenuOptions(group),
                    },
                });
            }
        }
    }

    // show menu
    if (!menu_info) {
        return;
    }

    const menu = new LiteGraph.ContextMenu(menu_info, options, ref_window);

    function inner_option_clicked(v: { content: string; slot: any; }, options: any, e: any) {
        if (!v) {
            return;
        }

        if (v.content == 'Remove Slot') {
            var info = v.slot;
            if (info.input) {
                node.removeInput(info.slot);
            } else if (info.output) {
                node.removeOutput(info.slot);
            }
            return;
        } else if (v.content == 'Disconnect Links') {
            var info = v.slot;
            if (info.output) {
                node.disconnectOutput(info.slot);
            } else if (info.input) {
                node.disconnectInput(info.slot);
            }
            return;
        } else if (v.content == 'Rename Slot') {
            var info = v.slot;
            const slot_info = info.input
                ? node.getInputInfo(info.slot)
                : node.getOutputInfo(info.slot);
            const dialog = that.createDialog(
                    '<span class=\'name\'>Name</span><input autofocus type=\'text\'/><button>OK</button>',
                    options
            );
            const input = dialog.querySelector('input');
            if (input && slot_info) {
                input.value = slot_info.label || '';
            }
            dialog
                .querySelector('button')
                .addEventListener('click', function(e) {
                    if (input.value) {
                        if (slot_info) {
                            slot_info.label = input.value;
                        }
                        that.setDirty(true);
                    }
                    dialog.close();
                });
        }

        // if(v.callback)
        //	return v.callback.call(that, node, options, e, menu, that, event );
    }
};

}

global.LGraphCanvas = LiteGraph.LGraphCanvas = LGraphCanvas;



/* Interaction */

/* LGraphCanvas render */
const temp = new Float32Array(4);
const temp_vec2 = new Float32Array(2);
const tmp_area = new Float32Array(4);
const margin_area = new Float32Array(4);
const link_bounding = new Float32Array(4);
const tempA = new Float32Array(2);
const tempB = new Float32Array(2);



// API *************************************************
// like rect but rounded corners
if (typeof (window) !== 'undefined' && window.CanvasRenderingContext2D) {
    window.CanvasRenderingContext2D.prototype.roundRect = function(
        x,
        y,
        width,
        height,
        radius,
        radius_low
    ) {
        if (radius === undefined) {
            radius = 5;
        }

        if (radius_low === undefined) {
            radius_low = radius;
        }

        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);

        this.lineTo(x + width, y + height - radius_low);
        this.quadraticCurveTo(
                x + width,
                y + height,
                x + width - radius_low,
                y + height
        );
        this.lineTo(x + radius_low, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius_low);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    };
}

function compareObjects(a: { [x: string]: any; }, b: { [x: string]: any; }) {
    for (const i in a) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}
LiteGraph.compareObjects = compareObjects;

function distance(a: any[], b: any[]) {
    return Math.sqrt(
            (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
    );
}
LiteGraph.distance = distance;

function colorToString(c: string | any[]) {
    return (
        'rgba(' +
            Math.round(c[0] * 255).toFixed() +
            ',' +
            Math.round(c[1] * 255).toFixed() +
            ',' +
            Math.round(c[2] * 255).toFixed() +
            ',' +
            (c.length == 4 ? c[3].toFixed(2) : '1.0') +
            ')'
    );
}
LiteGraph.colorToString = colorToString;

function isInsideRectangle(x: number, y: number, left: number, top: number, width: number, height: number) {
    if (left < x && left + width > x && top < y && top + height > y) {
        return true;
    }
    return false;
}
LiteGraph.isInsideRectangle = isInsideRectangle;

// [minx,miny,maxx,maxy]
function growBounding(bounding: any[], x: number, y: number) {
    if (x < bounding[0]) {
        bounding[0] = x;
    } else if (x > bounding[2]) {
        bounding[2] = x;
    }

    if (y < bounding[1]) {
        bounding[1] = y;
    } else if (y > bounding[3]) {
        bounding[3] = y;
    }
}
LiteGraph.growBounding = growBounding;

// point inside bounding box
function isInsideBounding(p: number[], bb: number[][]) {
    if (
        p[0] < bb[0][0] ||
            p[1] < bb[0][1] ||
            p[0] > bb[1][0] ||
            p[1] > bb[1][1]
    ) {
        return false;
    }
    return true;
}
LiteGraph.isInsideBounding = isInsideBounding;

// bounding overlap, format: [ startx, starty, width, height ]
function overlapBounding(a: number[] | Float32Array | null, b: number[] | Float32Array) {
    const A_end_x = a[0] + a[2];
    const A_end_y = a[1] + a[3];
    const B_end_x = b[0] + b[2];
    const B_end_y = b[1] + b[3];

    if (
        a[0] > B_end_x ||
            a[1] > B_end_y ||
            A_end_x < b[0] ||
            A_end_y < b[1]
    ) {
        return false;
    }
    return true;
}
LiteGraph.overlapBounding = overlapBounding;

// Convert a hex value to its decimal value - the inputted hex must be in the
//	format of a hex triplet - the kind we use for HTML colours. The function
//	will return an array with three values.
function hex2num(hex: string) {
    if (hex.charAt(0) == '#') {
        hex = hex.slice(1);
    } // Remove the '#' char - if there is one.
    hex = hex.toUpperCase();
    const hex_alphabets = '0123456789ABCDEF';
    const value = new Array(3);
    let k = 0;
    let int1, int2;
    for (let i = 0; i < 6; i += 2) {
        int1 = hex_alphabets.indexOf(hex.charAt(i));
        int2 = hex_alphabets.indexOf(hex.charAt(i + 1));
        value[k] = int1 * 16 + int2;
        k++;
    }
    return value;
}

LiteGraph.hex2num = hex2num;

// Give a array with three values as the argument and the function will return
//	the corresponding hex triplet.
function num2hex(triplet: number[]) {
    const hex_alphabets = '0123456789ABCDEF';
    let hex = '#';
    let int1, int2;
    for (let i = 0; i < 3; i++) {
        int1 = triplet[i] / 16;
        int2 = triplet[i] % 16;

        hex += hex_alphabets.charAt(int1) + hex_alphabets.charAt(int2);
    }
    return hex;
}

LiteGraph.num2hex = num2hex;





Math.clamp = function(v, a, b) {
    return a > v ? a : b < v ? b : v;
};

if (typeof window !== 'undefined' && !window['requestAnimationFrame']) {
    window.requestAnimationFrame =
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
}


