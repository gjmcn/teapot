////////////////////////////////////////////////////////////////
// Everything in one big file for now to keep the bundle size
// down. Split up the code when Zap has better compiler options.
////////////////////////////////////////////////////////////////

////////// dev //////////
// importAll 'https://cdn.skypack.dev/d3-shape' d3
// importDefault 'https://cdn.skypack.dev/lodash@4.17' lodash
// cloneDeep merge #= lodash
/////////////////////////

importAll 'd3-shape' d3
importDefault 'lodash-es/merge.js' merge
importDefault 'lodash-es/cloneDeep' cloneDeep

import './defaults.js' defOptions defChannels defShapeScheme
export tp


// ========== helpers ==========

// clip and gradient counts
clipCount = 0
gradientCount = 0

// all mark names
markNames = @@ 'hBar' 'vBar' 'point' 'circle' 'rect' 'segment' 'hLink' 'vLink'
| 'arc' 'edge' 'text' 'path' 'line' 'hBand' 'vBand'

// single marks
singleMarkNames = @@ 'line' 'hBand' 'vBand'

// marks that can use transition channels
transitionMarkNames = @@ 'circle' 'hBar' 'vBar' 'rect' 'text'

// channel names
channelNames = new Set (defChannels ~keys)

// channels that cannot be updated
// (note that handlerChannelNames also cannot be updated)
nonUpdateChannelNames = @@ 'xOffset' 'yOffset' 'class' 'name' 'note' 'noteColor'
| 'noteOpacity' 'noteXOffset' 'noteYOffset' 'subplot'

// handler channels
handlerChannelNames = @@ 'mouseenter' 'mouseleave' 'click'

// iterable of elements
iterableOfElelements = fun elmts
    if (elmts isString)
        selectAll elmts
    | (elmts ?: Symbol,iterator)
        elmts
    | else
        @ elmts 

// kind of channel
getKind = fun ch
    defChannels ~get ch : '_kind'

// x and y channels
xyChannelNames = @@ 'x' 'xx' 'y' 'yy'

// common channels not used by path
nonPathChannelNames = @@ 'x' 'y' 'xOffset' 'yOffset'

// fill and stroke channels used in legend
legendFillStrokeChannels = @@ 'fill' 'fillOpacity'
| 'stroke' 'strokeOpacity' 'strokeWidth' 'strokeDash'

// angle channels
angleChannels = @@ 'startAngle' 'endAngle' 'padAngle'

// curve types
curveTypes = @@ 'basis' 'basisOpen' 'bundle' 'cardinal' 'cardinalOpen'
| 'catmullRom' 'catmullRomOpen' 'linear' 'monotoneX' 'monotoneY' 'natural'
| 'curveStep' 'curveStepAfter' 'curveStepBefore' 'basisClosed' 'cardinalClosed'
| 'catmullRomClosed' 'linearClosed'

// mark-channel error message
markChannelError = [+ 'mark-'a', channel-'b', 'c \Error throw]

// test if value is Infinity, -Infinity or NaN
isInfOrNaN = fun val
    val isNaN || (val == Infinity) || (val == (- Infinity))

// error messages
nonFiniteMsg = 'non-finite data value (NaN, Infinity or -Infinity)'
allMissingMsg = 'every datum has a missing value'

// is array of objects/arrays?
isArrayOfObjects = fun d
    d isArray && (d every [typeof a == 'object' && (a != null)])

// get dataset
getDataset = fun ds
    if (ds isInteger && (ds > 0))
        ds = empties ds each v i a
            a;i = i
    | (ds isArray !)
        'dataset must be an array or a positive integer' \Error throw
    | (ds,length == 0)
        'dataset cannot be empty' \Error throw
    ds

// captitalize first character of string
capitalize = fun s
    s,0 toUpperCase + (s ~slice 1)

// camel case to kebab case
camelToKebab = fun s
    s ~replace &/[A-Z]/g [+ '-'(a toLowerCase)]

// crop tilde
cropTilde = fun s
    s isString && (s,0 == '~') ? (s ~slice 1) s

// min/max of array where ignore undefined and null elements
minVal = fun arr
    mn = Infinity
    arr each v
        if ((v != null) && (v != undefined) && (v < mn))
            mn \= v
    mn
maxVal = fun arr
    mx = - Infinity
    arr each v
        if ((v != null) && (v != undefined) && (v > mx))
            mx \= v
    mx

// check shape scheme, returns the scheme
checkShapeScheme = fun scheme mk
    if (scheme != defShapeScheme &&
    | (scheme some [defShapeScheme ~includes a !]))
        + 'mark-'mk,type', invalid shape name' \Error throw
    scheme

// check data array and get indices of missing values
checkData = fun arr mk ch
    if (arr,length == 0)
        \markChannelError mk,type ch 'empty data array'
    if (arr some isInfOrNaN)
        \markChannelError mk,type ch nonFiniteMsg
    if ((mk,missing == 'skip') || (mk,missing == 'gap'))
        missingInds = @@
        arr,length do i
            if (arr;i isNullish)
                missingInds ~add i
        if (missingInds,size == arr,length)
            \markChannelError mk,type ch allMissingMsg
    | else
        if (arr some [a isNullish])
            \markChannelError mk,type ch 'missing data value'
    # data arr attach missingInds 

// get channel default
getChannelDefault = fun mk ch
    obj = defChannels ~get ch
    obj ~hasOwnProperty mk,type ? (obj : mk,type) obj,def

// get option that can be a 4-array or a number - assume default is a number
fourOption = fun _options opName 
    _options;opName as passed
        def = defOptions;opName
        if (passed isArray)
            4 empties each e i arr
                arr;i = passed;i ?? def
        | else
            4 empties ~fill (passed ?? def)

// populate data map from order or seq option
populateDataMap = fun dMap ch orderOp seqOp
    if (orderOp isNullish !)
        if (orderOp isArray !)
            + ch'Order is not an array' \Error throw
        if (orderOp some [typeof a == 'number'])
            + ch'Order contains a number' \Error throw
        if (orderOp some [a isNullish])
            + ch'Order contains a null or undefined value' \Error throw
        if (new Set orderOp : 'size' < orderOp,length)
            + ch'Order contains a duplicate' \Error throw
        orderOp each val
            dMap ~set val dMap,size
    | (seqOp isNullish !)
        if (seqOp isInteger ! ||  (seqOp <= 0))
            + ch'Seq must be a positive integer' \Error throw
        j = 0
        do
            if (j < seqOp)
                dMap ~set (j string) j
                j += 1
            | else
                stop

// update data map: adds key if unused (and not a number), returns value
updateDataMap = fun dataMap key
    if (typeof key == 'number')
        key
    | (dataMap ~has key)
        dataMap ~get key
    | else
        sz = dataMap,size
        dataMap ~set key sz
        sz

// set attribute unless value is nullish, returns the element
setUnlessNullish = fun elm attrName val
    if (val isNullish !)
        elm attr attrName val
    elm

// use color scheme - mutates data if it is an array
useColorScheme = fun data scheme mk ch
    isConst = data isArray !
    if (typeof scheme == 'function')  // continuous scheme
        mn mx @= mk : (+ ch'Limits') ?? (@ null null)
        mn = mn ?? (isConst ? data (\minVal data)) number
        mx = mx ?? (isConst ? data (\maxVal data)) number
        if (mn isFinite && (mx isFinite) !)
            \markChannelError mk,type ch
                + ch' limits are not finite'
        if (mx - mn < 1e-14)
            \markChannelError mk,type ch
                + ch' limits are equal or the wrong way round'
        if isConst
            data \= data - mn / (mx - mn) \scheme
        | else
            rng = mx - mn
            do data,length i
                data;i = data;i - mn / rng \scheme
        info = # 'min' mn 'max' mx attach scheme
    | else  // discrete scheme
        if isConst
            data \= scheme;data
        | else
            do data,length i
                data;i = scheme : data;i
        info = # attach scheme
    # attach data info

// approx equal to    
equalTo = fun u v
    u - v abs < 1e-14

// magnitude of a number: its index in standard form
magnitude = fun v
    sf = v ~toExponential
    sf ~slice (sf ~indexOf 'e' + 1) number

// as magnitude, but if v is a power of 10, use an index of 1 less
magnitude10 = fun v
    m = \magnitude v
    10 ^ m \equalTo v ? (m - 1) m

// round to given magnitude
roundToMagnitude = fun v mag upDown
    magVal = 10 ^ mag
    v = v / magVal
    r = v round
    v = if (v \equalTo r)
        r
    | (upDown == 'up')
        ceil v
    | (upDown == 'down')
        floor v
    | else
        r
    v * magVal \enforceRound mag

// assume v rounded to mag, but now enforce that rounded to mag exactly: for
// decimals, removes tiny delta caused by floating point issues
enforceRound = fun v mag
    mag < 0 ? (v ~toFixed (mag abs) number) v

// magnitude of highest precision digit
// (should only use where expect t to have few significant figures)
accuracy = fun t
    m = \magnitude t
    s = 1
    do
        if (t ~toPrecision s number \equalTo t)
            stop
        | (s == 14)
            'failed to compute accuracy' \Error throw
        | else
            s += 1
    m - s + 1

// get text width
getTextWidth = fun ctx txt
    ctx ~measureText txt : 'width'

// shape info
// (xMult, yMult, xShift and yShift used in legend spacing hack)
shapeDetails = #
| 'circle'         (# name 'Circle'   xMult 1.138  yMult 1.138)
| 'square'         (# name 'Square'   xMult 1      yMult 1)
| 'diamond'        (# name 'Square'   xMult 1.414  yMult 1.414 rotate 45)
| 'star'           (# name 'Star'     xMult 1.777  yMult 1.777)
| 'wye'            (# name 'Wye'      xMult 1.469  yMult 1.469)
| 'triangle-up'    (# name 'Triangle' xMult 1.477  yMult 1.3    yShift    0.2)
| 'triangle-down'  (# name 'Triangle' xMult 1.477  yMult 1.3    yShift (- 0.2)  rotate 180)
| 'triangle-right' (# name 'Triangle' xMult 1.3    yMult 1.477  xShift (- 0.15) rotate  90)
| 'triangle-left'  (# name 'Triangle' xMult 1.3    yMult 1.477  xShift    0.15  rotate 270)
| plus             (# name 'Cross'    xMult 1.331  yMult 1.331)
| times            (# name 'Cross'    xMult 1.254  yMult 1.254 rotate 45)

// point symbol: modifies ops,path or creates new path, returns the path
pointSymbol = fun ops
    path shape area x y #= ops
    name rotate #= shapeDetails;shape
    tform = + 'translate('x' 'y')'
    if rotate
        tform += + ' rotate('rotate')'
    path ?? ($path)
    | attr 'd'
        d3 ~symbol (d3 : (+ 'symbol'name)) area call
    | attr 'transform' tform

// horizontal bar attribute values
hBarValues = fun ops
    x xx y h #= ops
    xCorner = x <> xx
    width = x - xx abs
    height = h
    yCorner = y - (h / 2)
    # attach xCorner yCorner width height

// vertical bar attribute values
vBarValues = fun ops
    x y yy w #= ops
    width = w
    xCorner = x - (w / 2)
    yCorner = y <> yy
    height = y - yy abs
    # attach xCorner yCorner width height

// d attribute for edge mark
dEdge = fun values
    x xx y yy size clockwise #= values
    r = (x - xx ^ 2) + (y - yy ^ 2) sqrt / 2 / (size ^ (1 / 3))
    + 'M 'x','y' A 'r' 'r' 0 0 'clockwise' 'xx','yy

// d attribute for line or band
dLineBand = fun ops
    missing nObs type curveType presentInds x xx y yy #= ops
    lineFunc = 
        if (type == 'line')                
            d3 ~line [\x a] [\y a]
        | (type == 'hBand')
            d3 ~area ~x [\x a] ~y0 [\y a] ~y1 [\yy a]
        | (type == 'vBand')
            d3 ~area ~x0 [\x a] ~x1 [\xx a] ~y [\y a]
    | ~curve (d3 : (+ 'curve'(curveType \capitalize)))
    if (missing == 'gap')
        lineFunc ~defined [presentInds ~has a] call 
            \[do nObs i (yield i)]
    | else
        \lineFunc presentInds

// set text transform
setTextTransform = fun elm x y rot
    tform = + 'translate('x','y')'
    if (rot isNullish !)
        tform = + 'rotate('rot','x','y') 'tform
    elm attr 'transform' tform

// set initial transition
setTransitionInitial = fun elm channels i
    delay = channels ~delay i
    duration = channels ~duration i
    ease = channels ~ease i
    \setTransition elm delay duration ease

// set transition
setTransition = fun elm delay duration ease
    if (delay || duration)
        elm style 'transition'
            + 'all '(duration || 0)'ms 'ease' '(delay || 0)'ms'
    | else
        elm : 'style' ~removeProperty 'transition'
    elm
    
// polygon centroid, from d3-polygon: https://github.com/d3/d3-polygon
polygonCentroid = fun p
    i = - 1
    n = p,length
    x = 0
    y = 0
    a = null
    b = p : (n - 1)
    c = null
    k = 0
    do
        i += 1
        if (i < n)
            a \= b
            b \= p;i
            c \= a,0 * b,1 - (b,0 * a,1)
            k += c
            x += a,0 + b,0 * c
            y += a,1 + b,1 * c
        | else
            stop
    k *= 3
    @ (x / k) (y / k)

// color ramp
colorRamp = fun schemeFun width height
    f = fun v
        1 - v \schemeFun
    id = +'legend-gradient-'gradientCount
    gradientCount += 1
    g = $g
    g insert ($defs)
    | insert ($linearGradient)
    | attr 'id' id
    | attr 'gradientTransform' 'rotate(90)'
    | insert (0 linSpace 1 16 encodeSVG 'stop')
    | attr 'offset' [a * 100 + '%']
    | attr 'stop-color' f
    g insert ($rect)
    | attr 'width'  width
    | attr 'height' height
    | attr 'fill'   (+ 'url(#'id')')
    g

// add to target
addToTarget = fun content target
    if target
        target isString ? (select target) target ~append content
    content

    
// ========== constructor ==========

tp = class
    this,_marks = @
    this,_dataset = null
    this,_options = #
    this,_state = null


// ========== plot method ==========

tp :: 'plot' = fun target

    _marks _dataset _options #= this
    _state = _options,_outerContainer ?
    | _options,_outerContainer,__tp__,state
    | (\cloneDeep this,_state)

    if (_marks,length == 0)
        'plot has no marks' \Error throw

    // local helpers
    op = [_options;a ?? defOptions;a]
    setAttr  = [a attr b (\op c)]
    setDimAttr = fun elm dim attrName opName
        elm attr attrName (dim + (\capitalize opName) \op ?? (opName \op))
    setFont = fun elm prefix
        elm
        | attr 'font-family'  (+ prefix'FontFamily' \op ?? ('fontFamily' \op))
        | attr 'font-size'    (+ prefix'FontSize'   \op ?? ('fontSize'   \op) + 'px')
        | attr 'font-style'   (+ prefix'FontStyle'  \op ?? ('fontStyle'  \op)) 
        | attr 'font-weight'  (+ prefix'FontWeight' \op ?? ('fontWeight' \op))
        | attr 'fill'         (+ prefix'Color'      \op ?? ('color'      \op))
        | attr 'fill-opacity' (+ prefix'Opacity'    \op ?? ('opacity'    \op))
        | attr 'stroke-width' 0
    getCanvasContext = fun prefix
        canvas ctx @= sketch
        ctx,font = + '' 
        | (+ prefix'FontStyle'  \op ?? ('fontStyle'  \op))' '
        | (+ prefix'FontWeight' \op ?? ('fontWeight' \op))' '
        | (+ prefix'FontSize'   \op ?? ('fontSize'   \op) + 'px')' '
        | (+ prefix'FontFamily' \op ?? ('fontFamily' \op))
        ctx

    // get mark-channel data
    channelData = fun mk ch markUpdate
        
        data = mk;ch
        isSubplot = ch == 'subplot'
        isHandler = handlerChannelNames ~has ch
        isSingleMarkNonXY =
            singleMarkNames ~has mk,type && (xyChannelNames ~has ch !)

        // nullish constant
        if (data isNullish)
            # isConst true data (\getChannelDefault mk ch)

        // data array
        | (data isArray)
            if (isSubplot || isHandler || isSingleMarkNonXY)
                \markChannelError mk,type ch 'unexpected array'
            data array \checkData mk ch
        
        // ~string or accessor
        | ((data isString && (data,0 == '~')) || (data isFunction))
            
            // get dataset
            ds = mk,data ?? _dataset
            if (ds !)
                \markChannelError mk,type ch
                    'no dataset attached to mark or plot'
            
            // ~string
            if (data isString)
                if (isSubplot || isHandler || isSingleMarkNonXY)
                    \markChannelError mk,type ch 'unexpected ~string'
                ds pick (data ~slice 1) \checkData mk ch
                
            // function
            | else    

                // check if function has state param - and if allowed to
                hasStateParam = data,length > 2
                if hasStateParam
                    if (nonUpdateChannelNames ~has ch || isHandler)
                        \markChannelError mk,type ch 'channel is not updatable'
                    if (defChannels ~get ch : '_kind' == 'text' && (mk,type != 'text'))
                        \markChannelError mk,type ch
                            'channel is not updatable unless used with a text mark'
                    if (mk,type == 'rect' && (mk,subplot isNullish !))
                        \markChannelError mk,type ch
                            'channel is not updatable since rect is a subplot'
                    
                // single-mark, non-xy channel - pass entire data set
                if isSingleMarkNonXY
                    if isHandler
                        # isConst true data ds  // not used, handlers lookup dataset directly
                    | else
                        if hasStateParam
                            markUpdate ~set ch
                                fun s  // 1 parameter indicates constant when update
                                    \data ds null s
                        val = \data ds null _state
                        if (\isInfOrNaN val)
                            \markChannelError mk,type ch nonFiniteMsg
                        # isConst true data (val ?? (\getChannelDefault mk ch))

                // standard behavior - pass datum
                | else
                    if isHandler
                        # isConst false data ds  // not used, handlers lookup dataset directly
                                                 // (though is used in that length of data
                                                 //  must be consistent with other channels)
                    | else
                        if hasStateParam
                            markUpdate ~set ch
                                fun i s  // 2 parameters indicates non-constant when update
                                    \data ds;i i s
                        if isSubplot
                            # isConst false data ds
                        | else
                            ds map d i (\data d i _state) \checkData mk ch
        
        // constant
        | else
            if (isSubplot || isHandler)
                \markChannelError mk,type ch 'unexpected constant value'
            if (\isInfOrNaN data)
                \markChannelError mk,type ch nonFiniteMsg
            # isConst true attach data
    
    // data maps - fill, stroke and shape maps are mark-specific: each key is a
    // a mark object, each value is a data map
    dataMaps = # x (##) y (##) fill (##) stroke (##) shape (##)
    'xy' each dim
        dataMaps;dim \populateDataMap dim (+ dim'Order' \op) (+ dim'Seq' \op)
    
    // limits
    limitsOp = \op 'limits'
    if (limitsOp isArray)
        if (limitsOp,length < 4)
            limitsOp = limitsOp array
            limitsOp,length = 4
        xMinOp xMaxOp yMinOp yMaxOp @= limitsOp `?? defOptions,limits
    | else
        xMinOp = limitsOp
        xMaxOp = limitsOp
        yMinOp = limitsOp
        yMaxOp = limitsOp
    xMin = (xMinOp == '_nice' || (xMinOp == '_data')) ?    Infinity  xMinOp
    xMax = (xMaxOp == '_nice' || (xMaxOp == '_data')) ? (- Infinity) xMaxOp
    yMin = (yMinOp == '_nice' || (yMinOp == '_data')) ?    Infinity  yMinOp
    yMax = (yMaxOp == '_nice' || (yMaxOp == '_data')) ? (- Infinity) yMaxOp
    xMinReqd = xMin ==    Infinity
    xMaxReqd = xMax == (- Infinity)
    yMinReqd = yMin ==    Infinity
    yMaxReqd = yMax == (- Infinity)
     
    
    // ========== iterate over marks ==========
    // process channels, get limits, build data maps
    
    markChannels = ##
    markObs = ##
    markSchemes = ##
    markAreaInfo = ##
    markPresentInds = ##
    markUpdates = ##

    _marks each mk

        type #= mk
        channels = #
        nObs = null
        schemeInfo = #
        markUpdate = ##
        missingAll = @@
        channelsList = @@
        noteUsed = mk,note isNullish !
        pieUsed  = mk,pie  isNullish !


        // ========== first iteration over channels  ==========
        // basic checks and get indices of missing data

        channelNames each ch

            // mark has this channel?
            kind = \getKind ch
            if (
            | (kind == 'common' && (type != 'path' || (nonPathChannelNames ~has ch !))) ||
            | (type == 'text' && (kind == 'text')) ||
            | (type != 'text' && (type != 'path') && noteUsed &&
            |   (kind == 'text' || (kind == 'note'))) ||
            | (kind == 'special' && (defChannels ~get ch ~hasOwnProperty type) && 
            |   (pieUsed ! && (ch == 'pie') !))
            | )

                // push to channel list for this mark
                channelsList ~add ch

                // data and indices of missing values
                data missingInds isConst #= \channelData mk ch markUpdate

                // angle channels must be constant when pie channel is used
                if (pieUsed && (angleChannels ~has ch) && (isConst !))
                    \markChannelError type ch
                        'data must be constant when used with pie channel'

                // add indices of missing data for this channel to those of the mark
                if missingInds
                    missingInds each i
                        missingAll ~add i

                // data for each channel must have the same length
                if (isConst !)
                    if (nObs == null)
                        nObs \= data,length
                    | (data,length != nObs)
                        \markChannelError type ch
                            'length of data not consistent with other channels'

                // store channel data
                channels;ch = data
        
        // if all channels are constant, set nObs to 1
        if (nObs == null)
            nObs = 1

        // indices of present (non-missing) observations
        presentInds = @@
        do nObs i
            presentInds ~add i
        missingAll each i
            presentInds ~'delete' i
        if (presentInds,size == 0)        
            + 'mark-'type', 'allMissingMsg \Error throw

        
        // ========== second iteration over channels ==========
        // construct data maps and map data, change from data to data getters
        
        channelsList each ch
        
            data = channels;ch
            isConst = data isArray !
            
            // construct data maps and map the data
            // x, xx, y, yy, fill, stroke, shape
            if ((xyChannelNames ~has ch) ||
            | (ch == 'fill') || (ch == 'stroke') || (ch == 'shape'))

                scheme = mk : (+ ch'Scheme')

                // data map
                if (xyChannelNames ~has ch)
                    dataMap = dataMaps : ch,0
                | else  // fill, stroke, shape
                    dataMap = null
                    if (scheme isString)
                        scheme = @ scheme
                    scope
                        if (ch == 'shape' ||
                        | (scheme isNullish ! && (typeof scheme != 'function')))
                            dataMap \= ##
                            dataMap \populateDataMap
                            | ch (mk : (+ ch'Order')) (mk : (+ ch'Seq'))
                            dataMaps;ch ~set mk dataMap
                
                // if channel has data map, transform non-numeric data values to integers
                if dataMap
                    if isConst  // default never nullish for these channels
                        data \= \updateDataMap dataMap data
                    | else 
                        data each v i
                            // if datum has missing value (on any channel) should not contribute to data map
                            if (presentInds ~has i)
                                data;i = \updateDataMap dataMap v

                // fill, stroke - if using scheme, replace data with colors
                if (ch == 'fill' || (ch == 'stroke'))
                    scope
                        if (scheme isNullish !)
                            actualColors = \useColorScheme data scheme mk ch
                            data \= actualColors,data  // for constant data (array data is mutated by useColorScheme)
                            schemeInfo;ch = actualColors,info

                // shape: replace integers with shape name
                | (ch == 'shape')
                    scheme ?? defShapeScheme \checkShapeScheme mk as s
                        if isConst
                            data \= s;data
                        | else
                            do data,length i
                                data;i = s : data;i
                        schemeInfo,shape = # scheme s
            
            // data getter for channel (constant getter has length 0)
            channels;ch = isConst ? (fun (data)) (fun i (data;i))


        // ========== update x and y limits ========== 

        scope
            xMinNeed = xMinReqd
            xMaxNeed = xMaxReqd
            yMinNeed = yMinReqd
            yMaxNeed = yMaxReqd
            x y xx yy size #= channels
            if dataMaps,x,size
                if xMinNeed
                    xMin \= xMin <> 0
                if xMaxNeed
                    xMax \= xMax >< (dataMaps,x,size - 1)
            if dataMaps,y,size
                if yMinNeed
                    yMin \= yMin <> 0
                if yMaxNeed
                    yMax \= yMax >< (dataMaps,y,size - 1)
            if (type == 'rect' && (mk,pixels !))
                w = channels,width
                h = channels,height
                corner = mk,corner
                if (xMinNeed)
                    presentInds each i
                        xMin \= xMin <> (corner ? (\x i) (\x i - (\w i / 2)))
                    xMinNeed \= false
                if (xMaxNeed)
                    presentInds each i
                        xMax \= xMax >< (\x i + (\w i / (corner ? 1 2)))
                    xMaxNeed \= false
                if (yMinNeed)
                    presentInds each i
                        yMin \= yMin <> (corner ? (\y i) (\y i - (\h i / 2)))
                    yMinNeed \= false
                if (yMaxNeed)
                    presentInds each i
                        yMax \= yMax >< (\y i + (\h i / (corner ? 1 2)))
                    yMaxNeed \= false
            | (type == 'vBar')
                if (xMinNeed)
                    presentInds each i
                        xMin \= xMin <> (\x i - (\size i / 2))
                    xMinNeed \= false
                if (xMaxNeed)
                    presentInds each i
                        xMax \= xMax >< (\x i + (\size i / 2))
                    xMaxNeed \= false
            | (type == 'hBar')
                if (yMinNeed)
                    presentInds each i
                        yMin \= yMin <> (\y i - (\size i / 2))
                    yMinNeed \= false
                if (yMaxNeed)
                    presentInds each i
                        yMax \= yMax >< (\y i + (\size i / 2)) 
                    yMaxNeed \= false
            if xMinNeed
                if x
                    presentInds each i
                        xMin \= xMin <> (\x i)
                if xx
                    presentInds each i
                        xMin \= xMin <> (\xx i)
            if xMaxNeed
                if x
                    presentInds each i
                        xMax \= xMax >< (\x i)
                if xx
                    presentInds each i
                        xMax \= xMax >< (\xx i)
            if yMinNeed
                if y
                    presentInds each i
                        yMin \= yMin <> (\y i)
                if yy
                    presentInds each i
                        yMin \= yMin <> (\yy i)
            if yMaxNeed
                if y
                    presentInds each i
                        yMax \= yMax >< (\y i)
                if yy
                    presentInds each i
                        yMax \= yMax >< (\yy i)

        
        // ========== area scale ==========
        
        if (defChannels ~get 'area' ~hasOwnProperty type)
            markAreaInfo ~set mk
                scope
                    mn = presentInds reduce [a <> (channels ~area b)] Infinity
                    mx = presentInds reduce [a >< (channels ~area b)] (- Infinity)
                    #
                    | 'min' mn
                    | 'max' mx
                    | scale
                        if (mk,areaScale isNullish)
                            [a]
                        | (mk,areaScale isFunction)
                            fun val
                                mk ~areaScale val mn mx
                        | (mk,areaScale isArray)
                            mnArea = mk,areaScale,0 ?? mn
                            mxArea = mk,areaScale,1 ?? mx
                            if (mnArea >= mxArea)
                                + 'mark-'type', area min and max are equal or the wrong way round'
                                | \Error throw
                            rng = mx - mn
                            rngArea = mxArea - mnArea
                            [a - mn / rng * rngArea + mnArea]
                        | else
                            + 'mark-'type', areaScale must be an array or function'
                            | \Error throw


        // ========== store mark info ========== 

        markChannels ~set mk channels
        markObs ~set mk nObs
        markSchemes ~set mk schemeInfo
        markPresentInds ~set mk presentInds
        markUpdates ~set mk markUpdate


    // ========== legend ==========

    gLegend = $g
    legendWidth  = 0
    legendHeight = 0
    legendPosition = 'legendPosition' \op
    legendOut = legendPosition ~slice 0 3 == 'out'
    legendGap = 'legendGap' \op
    if ('legend' \op)
        scope

            symbolSize = 10
            rampHeight = 'legendRampHeight' \op
            rampWidth  = 15
            pointSize  = 64
            legendPadding = \fourOption _options 'legendPadding'
            hGap = 'legendLabelPadding' \op
            vGap = 1.5 * hGap

            // legend background <rect>
            legendRect = gLegend insert ($rect)
            | \setAttr 'fill'         'legendBackground'
            | \setAttr 'fill-opacity' 'legendBackgroundOpacity'
            | \setAttr 'stroke'       'legendBorderColor'
            | \setAttr 'stroke-width' 'legendBorderWidth'
            | \setUnlessNullish 'rx' ('legendCornerRadius' \op)
            
            // legend content <g>
            gContent = gLegend insert ($g)
            | attr 'text-anchor' 'start'
            | attr 'dominant-baseline' 'middle'
            | attr 'transform'
                (+ 'translate('legendPadding,3' 'legendPadding,0')')
            | \setFont 'legendLabel'
            titleFontSize = 'legendTitleFontSize' \op ?? ('fontSize' \op)
            labelFontSize = 'legendLabelFontSize' \op ?? ('fontSize' \op)
            titleCtx = \getCanvasContext 'legendTitle'
            labelCtx = \getCanvasContext 'legendLabel'
            contentHeight = 0
            contentWidth  = 0

            // iterate over marks
            _marks each mk

                type #= mk
                channels = markChannels ~get mk
                
                // constant values for legend channels
                chConst = #
                legendFillStrokeChannels each ch
                    chConst;ch = channels;ch,length ?
                    | (\getChannelDefault mk ch)
                    | (channels ~(ch))
                setConstant = fun elm chs
                    chs ?? legendFillStrokeChannels each ch
                        attrName = ch \camelToKebab
                        if (ch == 'strokeDash')
                            attrName += 'array'
                        elm attr attrName chConst;ch
                    elm
                
                // channels (that may be) shown in legend
                if (type == 'point')
                    @ 'fill' 'stroke' 'shape' 'area'
                | (type == 'circle')
                    @ 'fill' 'stroke' 'area'
                | else
                    @ 'fill' 'stroke'
                | each ch
                    
                    opValue      = mk : (+ ch'Legend')
                    chFormat     = mk : (+ ch'Format') ?? [a]
                    chSchemeInfo = markSchemes ~get mk ?: ch
                    chScheme     = chSchemeInfo ?: 'scheme'
                    
                    // if showing channel in legend
                    if (opValue == true ||
                    | (opValue != false && channels;ch,length) &&
                    | (ch == 'shape' || (ch == 'area') || chScheme))
                    
                        // title
                        titleValue = mk : (+ ch'Title')
                        if (titleValue isNullish !)
                            contentHeight +=
                                contentHeight ? (1.5 * vGap) 0 + (titleFontSize / 2)
                            contentWidth \= contentWidth ><
                                titleCtx \getTextWidth titleValue
                            gContent insert ($text)
                            | attr 'y' contentHeight
                            | text titleValue
                            | \setFont 'legendTitle'
                            contentHeight += titleFontSize / 2

                        // add label function
                        addLabel = fun nameInt symbolWidth central
                            symbolWidth ?= symbolSize
                            lbl = chFormat apply nameInt 
                            elm = $text
                            | text lbl
                            | attr 'x' (symbolWidth + hGap)
                            | attr 'y' contentHeight
                            if central
                                elm attr 'dominant-baseline' 'central'
                            elm into gContent
                            contentWidth \= contentWidth ><
                                symbolWidth + hGap + (labelCtx \getTextWidth lbl)

                        // fill and stroke
                        if (ch == 'fill' || (ch == 'stroke'))
                            scope
 
                                // discrete scheme
                                if (chScheme isArray)
                                    dataMaps;ch ~get mk each nameInt
                                        contentHeight += contentHeight ? vGap 0 + (labelFontSize / 2)
                                        pointElm = null
                                        if (type == 'point' || (type == 'circle'))
                                            pointElm = \pointSymbol
                                                # shape
                                                    if (type == 'circle' || channels,shape,length)
                                                        'circle'
                                                    | else
                                                        channels ~shape
                                                | area pointSize
                                                | x (pointSize sqrt / 2)
                                                | y contentHeight

                                        // stroke
                                        if (ch == 'stroke')
                                            pointElm ||
                                                $line
                                                | attr 'x2' symbolSize
                                                | attr 'y1' contentHeight
                                                | attr 'y2' contentHeight
                                            | attr 'stroke' (chScheme : nameInt,1)
                                            | \setConstant (@ 'strokeOpacity' 'strokeWidth' 'strokeDash')
                                            | attr 'fill' 'none'

                                        // fill
                                        | else
                                            pointElm || 
                                                $rect
                                                | attr 'y' (contentHeight - (symbolSize / 2))
                                                | attr 'width' symbolSize
                                                | attr 'height' symbolSize
                                            | attr 'fill' (chScheme : nameInt,1)
                                            | \setConstant (@ 'fillOpacity')
                                            | attr 'stroke' 'none'
                                        
                                        // insert symbol and add label
                                        | into gContent 
                                        \addLabel nameInt
                                        contentHeight += labelFontSize / 2

                                // continuous scheme
                                | (chScheme isFunction)
                                    contentHeight += contentHeight ? vGap 0
                                    gContent insert
                                        \colorRamp chScheme rampWidth rampHeight
                                        | attr 'transform' (+ 'translate(0 'contentHeight')')
                                        | attr 'fill-opacity' chConst,fillOpacity
                                    mn = chSchemeInfo : 'min' \chFormat
                                    mx = chSchemeInfo : 'max' \chFormat
                                    contentWidth \= contentWidth ><
                                        rampWidth + hGap + 
                                            labelCtx \getTextWidth mn ><
                                                labelCtx \getTextWidth mx
                                    gContent insert ($text)
                                    | attr 'dominant-baseline' 'hanging'
                                    | attr 'x' (rampWidth + hGap)
                                    | attr 'y' contentHeight
                                    | text mx
                                    contentHeight += rampHeight
                                    gContent insert ($text)
                                    | attr 'dominant-baseline' 'auto'
                                    | attr 'x' (rampWidth + hGap)
                                    | attr 'y' contentHeight
                                    | text mn

                        // shape
                        | (ch == 'shape')
                            dataMaps,shape ~get mk each nameInt
                                contentHeight += contentHeight ? vGap 0 + (labelFontSize / 2)
                                \pointSymbol
                                    # shape (chScheme : nameInt,1)
                                    | area pointSize
                                    | x (pointSize sqrt / 2)
                                    | y contentHeight
                                | \setConstant
                                | into gContent
                                \addLabel nameInt
                                contentHeight += labelFontSize / 2

                        // area
                        | (ch == 'area')
                            scope
                                areaInfo = markAreaInfo ~get mk
                                mn = areaInfo : 'min'
                                mx = areaInfo : 'max'
                                scale #= areaInfo
                                ticks = mk,areaTickValues ?? (@ mn (mn + mx / 2) mx)
                                if ticks,length
                                    shp = (type == 'circle' || channels,shape,length) ?
                                    | 'circle' (channels ~shape)
                                    xMult yMult xShift yShift #= shapeDetails;shp
                                    areas = ticks ~'map' scale
                                    hLengths = areas sqrt `* xMult
                                    vLengths = areas sqrt `* yMult
                                    hMax = hLengths max
                                    jumps = vLengths `>< labelFontSize `/ 2
                                    x = 0.5 + (xShift ?? 0) * hMax
                                    ticks each tick i
                                        if contentHeight
                                            contentHeight += vGap
                                        contentHeight += (jumps : (i - 1) ?? 0) + jumps;i
                                        \pointSymbol
                                            # shape shp
                                            | area areas;i
                                            | x x 
                                            | y (contentHeight + (jumps;i * (yShift ?? 0))) 
                                        | \setConstant
                                        | into gContent
                                        \addLabel (@ tick i) hMax 'central'
                                    contentHeight += jumps : (ticks,length - 1)

            // set width and height of legend and background rectangle
            if contentWidth                                                
                legendWidth  \= contentWidth + legendPadding,3 + legendPadding,1
                legendHeight \= contentHeight + legendPadding,0 + legendPadding,2
                legendRect
                | attr 'width'  legendWidth
                | attr 'height' legendHeight


    // ========== if plot option false, return legend ==========
    
    if ('plot' \op == false)
        gLegend
    | else


        // ========== finalize limits, get magnitudes and ranges ========== 

        if (xMin isFinite && (xMax isFinite) !)
            'x limits are not finite numbers' \Error throw
        if (yMin isFinite && (yMax isFinite) !)
            'y limits are not finite numbers' \Error throw
        if (xMax - xMin < 1e-14)
            if ((xMin == 0) && (xMax == 0) && (xMinOp == '_nice') && (xMaxOp == '_nice'))
                xMin = - 1
                xMax = 1
            | else
                'x limits are equal or the wrong way round' \Error throw
        if (yMax - yMin < 1e-14)
            if ((yMin == 0) && (yMax == 0) && (yMinOp == '_nice') && (yMaxOp == '_nice'))
                yMin = - 1
                yMax = 1
            | else
                'y limits are equal or the wrong way round' \Error throw
        xMag = xMax - xMin \magnitude10
        yMag = yMax - yMin \magnitude10
        if (xMinOp == '_nice')
            xMin = dataMaps,x,size ?
            | (xMin - 0.1)
            | (xMin \roundToMagnitude xMag 'down')
        if (xMaxOp == '_nice')
            xMax = dataMaps,x,size ?
            | (xMax + 0.1)
            | (xMax \roundToMagnitude xMag 'up')
        if (yMinOp == '_nice')
            yMin = dataMaps,y,size ?
            | (yMin - 0.1)
            | (yMin \roundToMagnitude yMag 'down')
        if (yMaxOp == '_nice')
            yMax = dataMaps,y,size ?
            | (yMax + 0.1)
            | (yMax \roundToMagnitude yMag 'up')
        xRange = xMax - xMin
        yRange = yMax - yMin


        // ========== compute ticks and labels ==========
        // (but do not create the elements yet)

        xClean = 'xClean' \op ?? ('clean' \op)
        yClean = 'yClean' \op ?? ('clean' \op)
        usedDims = + ''(xClean ? '' 'x')(yClean ? '' 'y')
        ticks  = # x (@) y (@)
        labels = # x (@) y (@)
        usedDims each dim
            dimTicks = + dim'Ticks' \op
            if (dimTicks || ('ticks' \op && (dimTicks isNullish)))
                dimMin dimMax @= (dim == 'x') ? (@ xMin xMax) (@ yMin yMax)
                dimIsCat = dataMaps;dim,size
                dimLabels = + dim'Labels' \op 
                if (dimLabels || ('labels' \op && (dimLabels isNullish)))
                    useLabels = true
                    fmt = + dim'Format' \op ?? [a]

                // function to add tick and label
                addTick =
                    if dimIsCat
                        nonNumericLookup = dataMaps;dim ~keys array
                        numericSet = new Set (dataMaps;dim ~values)
                        fun val
                            if (typeof val == 'number')
                                if (numericSet ~has val !)
                                    + dim'-ticks, numeric tick value has no corresponding categorical value'
                                    | \Error throw
                                ticks;dim ~push val
                                if useLabels
                                    labels;dim ~push (nonNumericLookup;val val \fmt)
                            | else
                                if (dataMaps;dim ~has val !)
                                    + dim'-ticks, categorical tick value does not appear in the data'
                                    | \Error throw
                                numVal = dataMaps;dim ~get val
                                ticks;dim ~push numVal
                                if useLabels
                                    labels;dim ~push (val numVal \fmt)
                    | else
                        fun val
                            if (typeof val != 'number')
                                + dim'-ticks, unexpected categorical (non-numeric) tick value'
                                | \Error throw
                            ticks;dim ~push val
                            if useLabels
                                labels;dim ~push (val \fmt)

                // add ticks and labels
                if (dimIsCat ! && (+ dim'TickMin' \op))
                    \addTick dimMin
                tickValues = + dim'TickValues' \op
                if (tickValues isNullish !)
                    tickValues each v
                        \addTick v
                | else  // generate tick values
                    tickStep = + dim'TickStep' \op
                    if dimIsCat
                        if (tickStep isNullish)
                            tickStep = 1
                        | else
                            tickStep = tickStep number abs
                            if (tickStep isInteger ! || (tickStep == 0))
                                + 'invalid 'dim'TickStep for categorical axis'
                                | \Error throw
                        dataMaps;dim ~values each v
                            if (v % tickStep == 0)    
                                \addTick v
                    | else
                        if (tickStep isNullish)
                            tickStepMag = (dim == 'x') ? xMag yMag
                            tickStep = 10 ^ tickStepMag
                        | else
                            tickStep = tickStep number abs
                            if (tickStep isFinite ! || (tickStep == 0) ||
                            | (dimMax - dimMin / tickStep > 1000))
                                + dim'TickStep is invalid or too small' 
                                | \Error throw
                            tickStepMag = tickStep \accuracy
                        t = dimMin \roundToMagnitude tickStepMag 'up'
                        do
                            if (t <= (dimMax + 1e-14))
                                \addTick t
                                t \= t + tickStep \enforceRound tickStepMag
                            | else
                                stop
                if (dimIsCat ! && (+ dim'TickMax' \op))
                    \addTick dimMax

    
        // ========== left, right, top, bottom space ========== 

        getXAxisSpace = fun
            space = 'xAxisPadding' \op  // used even if axis hidden
            xAxis = 'xAxis' \op
            if (xAxis || ('axis' \op && (xAxis isNullish)))
                space += 'xAxisWidth' \op ?? ('axisWidth' \op) / 2
            if ticks,x,length
                space += 'xTickLength' \op ?? ('tickLength' \op)
                if labels,x,length
                    space += 'xLabelPadding' \op +
                        'xLabelFontSize' \op ?? ('fontSize' \op) 
            space
        yAxisSpace = null
        getYAxisSpace = fun
            space = 'yAxisPadding' \op  // used even if axis hidden
            yAxis = 'yAxis' \op
            if (yAxis || ('axis' \op && (yAxis isNullish)))
                space += 'yAxisWidth' \op ?? ('axisWidth' \op) / 2
            if ticks,y,length
                space += 'yTickLength' \op ?? ('tickLength' \op)
                if labels,y,length
                    ctx = \getCanvasContext 'yLabel'
                    space += 'yLabelPadding' \op + 
                        labels,y reduce [a >< (ctx \getTextWidth b)] 0
            yAxisSpace \= space
        getTitle = fun dim  // dim can be x, y or plot
            title = + dim'Title' \op
            if (dim == 'x' || (dim == 'y') && (title isNullish))
                vbleName = _marks,0 ?: dim
                if (vbleName isString && (vbleName,0 == '~'))
                    title = vbleName ~slice 1                    
            | (title == false)  // do not use auto title
                title = null
            title
        getTitleSpace = fun dim  // dim can be x, y or plot
            \getTitle dim isNullish ? 0
                (+ dim'TitleFontSize' \op) ?? ('fontSize' \op) +
                | (+ dim'TitlePadding' \op)
        getSideSpace = fun side
            yClean ! && ('yAxisPosition' \op == side) ?
            | (yAxisSpace ?? (\getYAxisSpace) + (\getTitleSpace 'y'))
            | 0
        getTopSpace = fun
            'xAxisPosition' \op == 'bottom' || xClean ?
            | (\getTitleSpace 'plot')
            | (\getXAxisSpace + (\getTitleSpace 'x'))
        getBottomSpace = fun
            if xClean
                0
            | ('xAxisPosition' \op == 'bottom')
                \getXAxisSpace + (\getTitleSpace 'x')
            | else
                \getTitleSpace 'plot'
        paneSpaceOp = 'paneSpace' \op
        topSpace rightSpace bottomSpace leftSpace @=
            paneSpaceOp isArray ? paneSpaceOp (4 empties ~fill paneSpaceOp)
        topSpace    ?= \getTopSpace
        rightSpace  ?= \getSideSpace 'right'
        bottomSpace ?= \getBottomSpace
        leftSpace   ?= \getSideSpace 'left'


        // ========== width, height, paneWidth, paneHeight ==========

        plotSpace = \fourOption _options 'plotSpace'
        width = null
        height = null
        paneWidth = null
        paneHeight = null
        setWidthFromPaneWidth = fun
            width \=
                plotSpace,3 + leftSpace + paneWidth + rightSpace + plotSpace,1
            if (legendOut && legendWidth)
                width += legendWidth + legendGap
        setHeightFromPaneHeight = fun
            height \= plotSpace,0 + topSpace + plotSpace,2 +
                paneHeight + bottomSpace ><
                    legendOut ? legendHeight 0
        setPaneHeightFromHeight = fun
            paneHeight \=
                height - plotSpace,0 - topSpace - bottomSpace - plotSpace,2
        if ('width' \op == 'preserve' && ('height' \op == 'preserve'))
            'width and height are both "preserve"' \Error throw
        if ('setPaneSize' \op)
            paneWidth = 'width' \op
            paneHeight = 'height' \op 
            if (paneHeight == 'preserve')
                paneHeight = paneWidth / xRange * yRange
            | (paneWidth == 'preserve')
                paneWidth = paneHeight / yRange * xRange
            \setWidthFromPaneWidth
            \setHeightFromPaneHeight
        | else
            width = 'width' \op
            height = 'height' \op
            if (width != 'preserve')
                paneWidth =
                    width - plotSpace,3 - leftSpace - rightSpace - plotSpace,1
                if (legendOut && legendWidth)
                    paneWidth -= legendWidth + legendGap
                if (height == 'preserve')
                    paneHeight = paneWidth / xRange * yRange
                    \setHeightFromPaneHeight
                | else
                    \setPaneHeightFromHeight
            | else
                \setPaneHeightFromHeight                    
                paneWidth = paneHeight / yRange * xRange
                \setWidthFromPaneWidth
        if (paneWidth <= 0)
            'pane width is less than or equal to 0' \Error throw
        if (paneHeight <= 0)
            'pane height is less than or equal to 0' \Error throw


        // ========== reverse, scale, transform ==========

        xReverse = \op 'xReverse'
        yReverse = \op 'yReverse'
        xScale = xReverse ?
        | [xMax - a / xRange * paneWidth]
        | [a - xMin / xRange * paneWidth]
        yScale = yReverse ?
        | [yMax - a / yRange * paneHeight -]
        | [a - yMin / yRange * paneHeight -]
        xTransform = fun val
            if (val isNumber ! && dataMaps,x,size) 
                val = dataMaps,x ~get val
            val \xScale + leftSpace + this,xOffset
        yTransform = fun val
            if (val isNumber ! && dataMaps,y,size) 
                val = dataMaps,y ~get val
            val \yScale + topSpace + paneHeight - this,yOffset


        // ========== container svg/g, pane and grid ==========
        
        // container
        if _options,_outerContainer
            container = $g
            outerContainer = _options,_outerContainer
        | else
            container = $svg
            | attr 'viewBox' (+ '0 0 'width' 'height)
            | style 'cursor' 'default'
            | style '-moz-user-select' 'none'
            | style '-webkit-user-select' 'none'
            | style '-ms-user-select' 'none'
            | style 'user-select' 'none'
            | prop '__tp__' (# outerContainer true updatable (@) state _state)
            if (\op 'fit' != 'preserve')
                container
                | attr 'width'  width
                | attr 'height' height
            outerContainer = container
        \op 'class' as opClass
            if (opClass isNullish !)
                container addClass opClass

        // background <rect>
        container insert ($rect)
        | attr 'width'  width
        | attr 'height' height
        | \setAttr 'fill' 'background'
        | as bgrd
            cornerRadius = \op 'cornerRadius'
            if (cornerRadius isNullish !)
                bgrd attr 'rx' cornerRadius
        
        // plot <g>
        gPlot = container insert ($g)
        scope
            shift = legendPosition == 'out-left' && legendWidth ?
            | (legendWidth + legendGap)
            | 0
            gPlot attr 'transform'
                + 'translate('(plotSpace,3 + shift)' 'plotSpace,0')'

        // pane
        gPlot insert ($rect)
        | attr 'width'  paneWidth
        | attr 'height' paneHeight
        | attr 'x' leftSpace            
        | attr 'y' topSpace
        | \setAttr 'fill'         'paneBackground'
        | \setAttr 'stroke-width' 'paneBorderWidth'  
        | \setAttr 'stroke'       'paneBorderColor'

        // clip path
        paneClipId = null
        if ('clip' \op)
            paneClipId = + 'pane-clip-'clipCount
            clipCount += 1
            gPlot insert ($defs)
            | insert ($clipPath)
            | attr 'id' paneClipId
            | insert ($rect)
            | attr 'width'  paneWidth
            | attr 'height' paneHeight
            | attr 'x' leftSpace            
            | attr 'y' topSpace

        // grid
        usedDims each dim
            if ticks;dim,length
                dimGrid = + dim'Grid' \op
                if (dimGrid || ('grid' \op && (dimGrid isNullish)))
                    gGrid = gPlot insert ($g)
                    | \setDimAttr dim 'stroke-width'   'gridWidth'
                    | \setDimAttr dim 'stroke'         'gridColor'
                    | \setDimAttr dim 'stroke-opacity' 'gridOpacity'
                    | attr 'transform'
                        + 'translate('(leftSpace)' '(topSpace + paneHeight)')'
                    ticks;dim each val
                        if (dim == 'x')
                            x1 = val \xScale
                            x2 = x1
                            y1 = 0
                            y2 = - paneHeight
                        | else
                            x1 = 0
                            x2 = paneWidth
                            y1 = val \yScale
                            y2 = y1 
                        $line
                        | attr 'x1' x1
                        | attr 'x2' x2 
                        | attr 'y1' y1 
                        | attr 'y2' y2 
                        | into gGrid


        // ========== axes, ticks, labels and titles ==========

        usedDims each dim

            xDim = dim == 'x'
            top = xDim && ('xAxisPosition' \op == 'top')
            bottom = xDim && (top !)
            right = xDim ! && ('yAxisPosition' \op == 'right')
            left = xDim || right !
            xAxisPadding = 'xAxisPadding' \op 
            yAxisPadding = 'yAxisPadding' \op 
            
            // wrapper <g> for axis, ticks, labels and title
            xShiftWrap = leftSpace + 
            | (right ? (paneWidth + yAxisPadding) (left ? (- yAxisPadding) 0))
            yShiftWrap = topSpace +
            | (top ? (- xAxisPadding) (bottom ? (paneHeight + xAxisPadding) paneHeight))
            gWrap = gPlot insert ($g)  
            | attr 'text-anchor'
                xDim ? ('xLabelAlign' \op) (left ? 'end' 'start')
            | attr 'dominant-baseline'
                xDim ? (bottom ? 'hanging' 'auto') ('yLabelAlign' \op)
            | \setFont (+ dim'Label')
            | attr 'transform' (+ 'translate('xShiftWrap' 'yShiftWrap')')

            // axis
            axisUsed = false
            halfAxisWidth = 0
            dimAxis = + dim'Axis' \op
            if (dimAxis || ('axis' \op && (dimAxis isNullish)))
                axisUsed = true
                $line as line
                    line  
                    | \setDimAttr dim 'stroke-width'   'axisWidth'
                    | \setDimAttr dim 'stroke'         'axisColor'
                    | \setDimAttr dim 'stroke-opacity' 'axisOpacity'
                    | attr (+ dim'2') (xDim ? paneWidth (- paneHeight))
                    | into gWrap
                    halfAxisWidth \= line attr 'stroke-width' / 2

            // ticks and labels - loop over ticks
            tickLength = + dim'TickLength' \op ?? ('tickLength' \op)
            labelPadding = + dim'LabelPadding' \op
            labelRotate = + dim'LabelRotate' \op
            ticks;dim each val i
                gTick = gWrap insert ($g)
                | attr 'transform'
                    dim == 'x' ?
                    | (+ 'translate('(val \xScale)' '(top ? (- halfAxisWidth) halfAxisWidth)')')
                    | (+ 'translate('(left ? (- halfAxisWidth) halfAxisWidth)' '(val \yScale)')')
                
                // tick
                $line
                | \setDimAttr dim 'stroke-width'   'tickWidth'
                | \setDimAttr dim 'stroke'         'tickColor'
                | \setDimAttr dim 'stroke-opacity' 'tickOpacity'
                | attr (xDim ? 'y2' 'x2') (bottom || right ? tickLength (- tickLength))
                | into gTick
                
                // label
                if labels;dim,length
                    scope
                        labelShift = tickLength + labelPadding
                        labelOffset = + dim'LabelOffset' \op
                        lbl = $text
                        | text labels;dim;i
                        | attr (xDim ? 'y' 'x') (bottom || right ? labelShift (- labelShift))
                        | attr (xDim ? 'x' 'y') (xDim ? labelOffset (- labelOffset))
                        if (labelRotate isNullish !)
                            center = labelShift
                            if xDim
                                center += + dim'LabelFontSize' \op ?? ('fontSize' \op) / 2
                            lbl attr 'transform'
                                xDim ?
                                | (+ 'rotate('labelRotate',0,'(top ? (- center) center)')')
                                | (+ 'rotate('labelRotate','(left ? (- center) center)',0)')
                        lbl into gTick

            // titles
            scope
                dimTitle = \getTitle dim                   
                if (dimTitle isNullish !)
                    if xDim
                        x = 'xTitleOffset' \op
                        textAnchor = 'xTitleAlign' \op
                        if (textAnchor == 'end')
                            x += paneWidth
                        | (textAnchor != 'start')
                            x += paneWidth / 2
                            textAnchor = 'middle'
                        dominantBaseline = bottom ? 'hanging' 'auto'
                        y = 'xTitlePadding' \op + halfAxisWidth
                        if (ticks;dim,length)
                            y += tickLength
                        if (labels;dim,length)
                            y += labelPadding +
                                'xLabelFontSize' \op ?? ('fontSize' \op)
                        if top
                            y *= - 1
                        rotate = null
                    | else  // y title
                        x = 'yTitlePadding' \op + (yAxisSpace ?? (\getYAxisSpace)) -
                            yAxisPadding  // y axis padding is in gWrap transfn and yAxisSpace
                        if left
                            x *= - 1
                        textAnchor = 'yTitleAlign' \op
                        y = if (textAnchor == 'start')
                            0
                        | (textAnchor == 'end')
                            paneHeight -
                        | else
                            paneHeight / 2 -
                        dominantBaseline = left ? 'auto' 'hanging'
                        rotate = + 'rotate('(-90)' 'x' 'y')'
                    $text
                    | text dimTitle
                    | attr 'x' x                            
                    | attr 'y' y                            
                    | attr 'text-anchor' textAnchor   
                    | attr 'dominant-baseline' dominantBaseline
                    | \setUnlessNullish 'transform' rotate                   
                    | \setFont (+ dim'Title')
                    | into gWrap

        // plot title
        \getTitle 'plot' as plotTitle
            if (plotTitle isNullish !)
                top = 'xAxisPosition' \op == 'bottom' || xClean
                padding = 'plotTitlePadding' \op
                align = 'plotTitleAlign' \op
                $text
                | text plotTitle
                | attr 'x'
                    if (align == 'start')
                        leftSpace - 
                            'yAxisPosition' \op == 'left' && (yClean !) ?
                            | (yAxisSpace ?? (\getYAxisSpace))
                            | 0
                    | (align == 'end')
                        leftSpace + paneWidth + 
                            'yAxisPosition' \op == 'right' && (yClean !) ?
                            | (yAxisSpace ?? (\getYAxisSpace))
                            | 0
                    | else
                        leftSpace + paneWidth + rightSpace / 2
                    | + ('plotTitleOffset' \op)
                | attr 'y'
                    top ? (topSpace - padding) (topSpace + paneHeight + padding)
                | attr 'text-anchor' align
                | attr 'dominant-baseline' (top ? 'auto' 'hanging')                   
                | \setFont 'plotTitle'
                | into gPlot


        // ========== draw marks ==========

        updatable #= outerContainer,__tp__

        // finish mark: set attributes/properties
        finishMark = fun elm mk channels i isSubplot
            if (isSubplot !)
                elm
                | attr 'fill'           (channels ~fill i)
                | attr 'fill-opacity'   (channels ~fillOpacity i)
                | attr 'stroke'         (channels ~stroke i)
                | attr 'stroke-opacity' (channels ~strokeOpacity i)
                | attr 'stroke-width'   (channels ~strokeWidth i)
                | \setUnlessNullish 'stroke-linecap'   (channels ~strokeCap  i) 
                | \setUnlessNullish 'stroke-dasharray' (channels ~strokeDash i)
            c = channels ~'class' i
            if (c isNullish !)
                elm addClass c
            nm = channels ~name i
            if (nm isNullish !)
                elm attr 'data-tp-name' nm
            ds = mk,data ?? _dataset
            handlerChannelNames each eventType
                if (mk;eventType isNullish !)
                    elm ~addEventListener eventType
                        i == null ?
                        | (mk;eventType ~bind elm ds null)
                        | (mk;eventType ~bind elm ds;i i)

        // <g> containing all mark elements
        gMarks = gPlot insert ($g)
        | attr     'font-size'   ('fontSize' \op + 'px')
        | \setAttr 'font-family' 'fontFamily'
        | \setAttr 'font-style'  'fontStyle'
        | \setAttr 'font-weight' 'fontWeight'
        if paneClipId
            gMarks attr 'clip-path' (+ 'url(#'paneClipId')')

        // iterate over marks
        _marks each mk

            type #= mk
            channels = markChannels ~get mk
            xOffset yOffset size #= channels
            nObs = markObs ~get mk
            presentInds = markPresentInds ~get mk
            schemes = markSchemes ~get mk
            markUpdate = markUpdates ~get mk

            // x, xx, y, yy getters
            x =  fun i
                channels ~x  i \xScale + leftSpace + (\xOffset i)
            xx = fun i
                channels ~xx i \xScale + leftSpace + (\xOffset i)
            y =  fun i
                channels ~y  i \yScale + topSpace + paneHeight - (\yOffset i)
            yy = fun i
                channels ~yy i \yScale + topSpace + paneHeight - (\yOffset i)

            // insert mark element
            insertMark = fun elm i
                if (channels ~listen i !)
                    elm attr 'pointer-events' 'none'
                channels ~front i < 0 ?
                | (gMarks insert elm [gMarks,firstChild])
                | (gMarks insert elm)

            // function to create basic __tp__ object
            basic__tp__ =
                if (markUpdate ~has 'fill' || (markUpdate ~has 'stroke'))
                    colorTransform = fun val fillOrStroke
                        dm = dataMaps;fillOrStroke ~get mk
                        if (val isNumber ! && (dm ?: 'size'))
                            val = dm ~get val
                        info = schemes;fillOrStroke
                        if (info !)
                            val
                        | (info,scheme isArray)
                            info,scheme;val
                        | else
                            mn = info : 'min'
                            mx = info : 'max'
                            val - mn / (mx - mn) \info,scheme
                fun elm i isSingleMarkType
                    __tp__ = #
                    | attach outerContainer i xTransform yTransform
                    | colorTransform type markUpdate
                    if (type != 'path')
                        __tp__,xOffset = \xOffset i
                        __tp__,yOffset = \yOffset i
                        if (isSingleMarkType !)
                            __tp__,x = \x i
                            __tp__,y = \y i
                    if (transitionMarkNames ~has type)
                        __tp__,delay = channels ~delay i
                        __tp__,duration = channels ~duration i
                        __tp__,ease = channels ~ease i
                    elm attach __tp__
                    __tp__

            // text element
            textElm = fun i ti xi yi defaultCenter
                elm = $text
                | text ti
                | attr 'text-anchor'
                    defaultCenter ?
                    | (_options,hAlign ?? 'middle')  // hack for closed line
                    | (channels ~hAlign i)
                | attr 'dominant-baseline' (channels ~vAlign i)
                | \setUnlessNullish 'font-family' (channels ~fontFamily i) 
                | \setUnlessNullish 'font-style'  (channels ~fontStyle  i) 
                | \setUnlessNullish 'font-weight' (channels ~fontWeight i)
                fontSize = channels ~fontSize i
                if (fontSize isNullish !)
                    elm attr 'font-size' (fontSize + 'px')
                elm \setTextTransform xi yi (channels ~rotate i)

            // add note element if used
            addNote = fun markElm i xi yi defaultCenter
                if channels,note
                    ti = channels ~note i
                    if (ti string)
                        xi += channels ~noteXOffset i
                        yi -= channels ~noteYOffset i
                        colorChannel = channels ~noteColor as nc
                            nc == '_fill' || (nc == '_stroke') ?
                            | (nc ~slice 1)
                            | 'noteColor'
                        opacityChannel = channels ~noteOpacity as nOp
                            nOp == '_fillOpacity' || (nOp == '_strokeOpacity') ?
                            | (nOp ~slice 1)
                            | 'noteOpacity'
                        noteElm = \textElm i ti xi yi defaultCenter
                        markElm ~after noteElm
                        noteElm
                        | attr 'stroke' 'none'
                        | attr 'fill' (channels ~(colorChannel) i)
                        | attr 'fill-opacity' (channels ~(opacityChannel) i)

            // point, circle
            if (type == 'point' || (type == 'circle'))
                scope
                    areaScale = markAreaInfo ~get mk : 'scale'
                    presentInds each i
                        xi = \x i
                        yi = \y i
                        ai = channels ~area i \areaScale
                        if (type == 'point')
                            si = channels ~shape i
                            elm = \pointSymbol
                                # shape si
                                | area ai
                                | x xi
                                | y yi
                        | else
                            elm = $circle
                            | attr 'cx' xi
                            | attr 'cy' yi
                            | attr 'r' (ai / Math,PI sqrt)
                            | \setTransitionInitial channels i
                        if markUpdate,size
                            __tp__ = \basic__tp__ elm i
                            __tp__,areaTransform = areaScale
                            if (type == 'point')
                                __tp__,area = ai
                                __tp__,shape = si
                                __tp__,shapeTransform = fun val
                                    dm = dataMaps,shape ~get mk
                                    if (val isNumber ! && (dm ?: 'size'))
                                        val = dm ~get val
                                    schemes,shape,scheme;val
                            updatable ~push elm
                        \insertMark elm i
                        | \finishMark mk channels i
                        \addNote elm i xi yi

            // segment
            | (type == 'segment')
                presentInds each i
                    xxi = \xx i
                    yyi = \yy i
                    elm = $line
                    | attr 'x1' (\x i)
                    | attr 'y1' (\y i)
                    | attr 'x2' xxi
                    | attr 'y2' yyi
                    if markUpdate,size
                        \basic__tp__ elm i
                        updatable ~push elm
                    \insertMark elm i
                    | \finishMark mk channels i
                    \addNote elm i xxi yyi

            // rect
            | (type == 'rect')
                if mk,pixels
                    w = channels,width
                    h = channels,height
                | else
                    w = fun i
                        channels ~width  i / xRange * paneWidth
                    h = fun i 
                        channels ~height i / yRange * paneHeight
                presentInds each i
                    xi = \x i
                    yi = \y i
                    wi = \w i + abs
                    hi = \h i + abs
                    if mk,corner
                        xiMin = xReverse ? (xi - wi) xi
                        yiMin = yReverse ? yi (yi - hi)
                        cxi = xiMin + (wi / 2)
                        cyi = yiMin + (hi / 2)
                    | else  // centered
                        xiMin = xi - (wi / 2)
                        yiMin = yi - (hi / 2)
                        cxi = xi
                        cyi = yi
                    if (mk,subplot isNullish !)  // subplot
                        sp = tp ~option
                            # width wi 
                            | height hi
                            | _outerContainer outerContainer
                        mk,subplot ~'call' sp (channels ~subplot i) i
                        \insertMark (sp ~plot) i
                        | attr 'transform' (+ 'translate('xiMin' 'yiMin')')
                        | \finishMark mk channels i 'subplot'
                    | else  // standard rect
                        elm = $rect
                        | attr 'x' xiMin
                        | attr 'y' yiMin
                        | attr 'width' wi
                        | attr 'height' hi
                        | \setUnlessNullish 'rx' (channels ~cornerRadius i)
                        | \setTransitionInitial channels i
                        if markUpdate,size
                            __tp__ = \basic__tp__ elm i
                            __tp__,corner = mk,corner
                            __tp__,width = wi       
                            __tp__,height = hi
                            __tp__ attach xReverse yReverse
                            if mk,pixels
                                __tp__,widthFunc  = fun v (v + abs)
                                __tp__,heightFunc = fun v (v + abs)
                            | else
                                __tp__,widthFunc  = fun v (v / xRange * paneWidth  abs)
                                __tp__,heightFunc = fun v (v / yRange * paneHeight abs)
                            updatable ~push elm
                        \insertMark elm i
                        | \finishMark mk channels i
                        \addNote elm i cxi cyi
                    
            // hLink, vLink
            | ((type == 'hLink') || (type == 'vLink'))
                presentInds each i
                    xxi = \xx i
                    yyi = \yy i
                    d = d3 ~(type == 'hLink' ? 'linkHorizontal' 'linkVertical') call
                        # source (@ (\x i) (\y i))
                        | target (@ xxi yyi)
                    elm = $path
                    | attr 'd' d
                    if markUpdate,size
                        __tp__ = \basic__tp__ elm i
                        __tp__,xx = xxi
                        __tp__,yy = yyi
                        updatable ~push elm
                    \insertMark elm i
                    | \finishMark mk channels i
                    \addNote elm i xxi yyi

            // edge
            | (type == 'edge')
                presentInds each i
                    xi  = \x i
                    yi  = \y i
                    xxi = \xx i
                    yyi = \yy i
                    si  = \size i
                    cwi = channels ~clockwise i boolean number
                    elm = $path
                    | attr 'd'
                        # x xi y yi xx xxi yy yyi size si clockwise cwi \dEdge
                    if markUpdate,size
                        __tp__ = \basic__tp__ elm i
                        __tp__,xx = xxi
                        __tp__,yy = yyi
                        __tp__,size = si
                        __tp__,clockwise = cwi
                        updatable ~push elm
                    \insertMark elm i
                    | \finishMark mk channels i
                    \addNote elm i xxi yyi

            // text
            | (type == 'text')
                presentInds each i
                    elm = \textElm i (channels ~'text' i) (\x i) (\y i)
                    | \setTransitionInitial channels i
                    if markUpdate,size
                        __tp__ = \basic__tp__ elm i
                        __tp__,rotate = channels ~rotate i
                        updatable ~push elm
                    \insertMark elm i
                    | \finishMark mk channels i

            // arc
            | (type == 'arc')
                if channels,pie
                    pieData = d3 ~pie
                    | ~startAngle (channels ~startAngle)  // angle channels are constant
                    | ~endAngle   (channels ~endAngle)
                    | ~padAngle   (channels ~padAngle)
                    | ~sortValues
                        if (mk,pieSort isNullish) null 
                        |  (mk,pieSort == 'desc') [b - a]
                        |  (mk,pieSort == 'asc')  [a - b]
                        |  (typeof mk,pieSort == 'function') mk,pieSort
                        |  else
                            'mark-arc, invalid pieSort option' \Error throw
                    | call
                        presentInds map i (channels ~pie i)
                presentInds each i j
                    xi = \x i
                    yi = \y i
                    arcObj = d3 ~arc
                    | ~innerRadius  (channels ~innerRadius  i) 
                    | ~outerRadius  (channels ~outerRadius  i) 
                    | ~padRadius    (channels ~padRadius    i)
                    | ~cornerRadius (channels ~cornerRadius i)
                    if channels,pie
                        arcObj
                        | ~startAngle pieData;j,startAngle
                        | ~endAngle   pieData;j,endAngle
                        | ~padAngle   pieData;j,padAngle
                    | else
                        arcObj
                        | ~startAngle (channels ~startAngle i) 
                        | ~endAngle   (channels ~endAngle   i)
                        | ~padAngle   (channels ~padAngle   i)
                    elm = $path
                    \insertMark elm i
                    | attr 'd' (\arcObj)
                    | attr 'transform' (+ 'translate('xi' 'yi')')
                    | \finishMark mk channels i
                    cxi cyi @= arcObj ~centroid
                    \addNote elm i (xi + cxi) (yi + cyi)

            // hBar, vBar
            | (type == 'hBar' || (type == 'vBar'))
                presentInds each i
                    xi = \x i
                    yi = \y i
                    si = \size i
                    if (type == 'hBar')
                        xxi = \xx i
                        nxi = xi >< xxi
                        nyi = yi
                        h = si / yRange * paneHeight
                        bar = \hBarValues (# x xi xx xxi y yi h h)
                    | else
                        nxi = xi
                        yyi = \yy i
                        nyi = yi <> yyi
                        w = si / xRange * paneWidth
                        bar = \vBarValues (# x xi y yi yy yyi w w)
                    elm = $rect
                    | attr 'x' bar,xCorner
                    | attr 'y' bar,yCorner
                    | attr 'width' bar,width
                    | attr 'height' bar,height
                    | \setUnlessNullish 'rx' (channels ~cornerRadius i)
                    | \setTransitionInitial channels i
                    if markUpdate,size
                        __tp__ = \basic__tp__ elm i
                        __tp__,size = si
                        if (type == 'hBar')
                            __tp__,xx = xxi
                            __tp__,heightFunc = [this,size / yRange * paneHeight]
                        | else
                            __tp__,yy = yyi
                            __tp__,widthFunc = [this,size / xRange * paneWidth]
                        updatable ~push elm
                    \insertMark elm i
                    | \finishMark mk channels i
                    \addNote elm i nxi nyi

            // path
            | (type == 'path')
                presentInds each i
                    elm = $path
                    | attr 'vector-effect' 'non-scaling-stroke'
                    | \setUnlessNullish 'd' (channels ~path i)
                    | attr 'transform'
                        + 'translate('
                        | (\xScale 0 + leftSpace)','(\yScale 0 + topSpace + paneHeight)
                        | ') scale('
                        | (paneWidth  / xRange * (xReverse ? (-1) 1))','
                        | (paneHeight / yRange * (yReverse ? 1 (-1)))')'
                    if markUpdate,size
                        __tp__ = \basic__tp__ elm i
                        updatable ~push elm
                    \insertMark elm i
                    | \finishMark mk channels i

            // line, hBand, vBand
            | else
                scope
                    curveType = mk,curve ?? 'linear'
                    if (curveTypes ~has curveType !)
                        + 'mark-'type', invalid curve type: 'mk,curve \Error throw
                    lineBandArgs = # missing mk,missing
                    | attach nObs type curveType presentInds x xx y yy
                    elm = $path
                    if markUpdate,size
                        __tp__ = \basic__tp__ elm null true
                        __tp__ assign lineBandArgs 
                        updatable ~push elm                    
                    \insertMark elm
                    | attr 'd' (lineBandArgs \dLineBand)
                    | \finishMark mk channels null  // null required to pass full dataset to handlers
                    if channels,note
                        if (type == 'line' && (curveType ~slice (-6) == 'Closed'))
                            cx cy @= presentInds map i (@ (\x i) (\y i))
                            | \polygonCentroid
                            \addNote elm null cx cy 'defaultCenter'
                        | else
                            maxInd = presentInds max
                            fxi = \x maxInd
                            fyi = \y maxInd
                            if (type == 'line')
                                \addNote elm null fxi fyi
                            | (type == 'hBand')
                                \addNote elm null fxi (fyi + (\yy maxInd) / 2)
                            | else  // vBand
                                \addNote elm null (fxi + (\xx maxInd) / 2) fyi


        // ========== insert legend ==========

        if legendWidth       
            scope
                if legendOut
                    xPosn = legendPosition == 'out-left' ?
                    | plotSpace,3
                    | (width - plotSpace,1 - legendWidth)
                    yPosn = plotSpace,0 + topSpace
                | else    
                    xPosn =
                        if (legendPosition ~endsWith 'left')
                            leftSpace + legendGap
                        | (legendPosition ~endsWith 'right')
                            leftSpace + paneWidth - legendGap - legendWidth
                        | else  // center
                            leftSpace + (paneWidth / 2) - (legendWidth / 2)
                    yPosn =
                        if (legendPosition ~startsWith 'top')
                            topSpace + legendGap
                        | (legendPosition ~startsWith 'bottom')
                            topSpace + paneHeight - legendGap - legendHeight
                        | else  // center
                            topSpace + (paneHeight / 2) - (legendHeight / 2)
                gLegend attr 'transform' (+ 'translate('xPosn' 'yPosn')')
                legendOut ? container gPlot insert gLegend


        // ========== insert and return container ==========

        container \addToTarget target
 

// ========== other instance methods ==========

// option method
tp :: 'option' = fun newOptions
    if (newOptions isNullish)
        this,_options = #
    | else
        this,_options assign newOptions
    this

// data method
tp :: 'data' = fun d
    if this,_dataset
        'dataset already attached' \Error throw
    this,_dataset = \getDataset d
    this

// state method
tp :: 'state' = fun s
    if (this,_state != null)
        'initial state already set' \Error throw
    this,_state = \cloneDeep s
    this

// each method
tp :: 'each' = fun d f
    if (d isArray !)
        'array expected' \Error throw
    d ~forEach f this
    this

// call method
tp :: 'call' = fun f rest
    f ~'apply' this rest
    this

// layer method
tp :: 'layer' = fun rest
    if (rest,length > 2)
        data = tp ~'group' rest,0 rest,1
        f = rest,2
    | else
        data f @= rest
        if (data isArray !)
            'array expected' \Error throw
    data each row index
        f ~'call' this (row : 'group') row,name index
    this

// mark methods
markNames each name
    tp :: name = fun rest
        if (rest,length == 0)
            'at least one argument expected' \Error throw
        | (rest,length == 1)
            options = rest,0
        | else
            x y options @= rest
        mkObj = #
        if (rest,length > 1)
            mkObj attach x y
        mkObj assign options
        if (mkObj,data isNullish !)
            mkObj,data = \getDataset mkObj,data
        mkObj,type = name
        this,_marks ~push mkObj
        this


// ========== static methods ==========

// methods that can be used as instance or static
array markNames 'option' 'data' 'state' 'each' 'call' 'layer' each name
    tp;name = fun rest
        po = new tp
        po;name ~'apply' po rest
        po

// stack
scope
    stackData = fun data isHorizontal ops

        // process arguments
        groupByDim vbleDim @= isHorizontal ? (@ 'y' 'x') (@ 'x' 'y')
        groupBy = ops;groupByDim \cropTilde
        vble = ops;vbleDim \cropTilde
        stack = ops,stack \cropTilde
        offset <- 'none'
        ord = ops : 'order' ?? 'none'
        missing <- 'throw'
        binLimits #= ops
        isGroupBy = groupBy isNullish !
        isBinning = binLimits isNullish !
        isVble = vble isNullish !
        returnRows = ops,rows
        binProps = @ 'lower' 'upper' 'middle' 'range'
        if (data \isArrayOfObjects !)
            'array of objects/arrays expected' \Error throw
        if (data,length == 0)
            'empty data array' \Error throw
        if (stack isNullish)
            'stack option is required' \Error throw
        if (data some [
        | (isGroupBy && (a;groupBy \isInfOrNaN)) ||
        | (isVble && (a;vble \isInfOrNaN)) ||
        | (a;stack \isInfOrNaN)])
            nonFiniteMsg \Error throw    
        if (missing == 'skip')
            data = data filter
                fun d
                    (isGroupBy && (d;groupBy isNullish) ||
                    | (isVble && (d;vble isNullish)) ||
                    | (d;stack isNullish)) !
            if (data,length == 0)
                allMissingMsg \Error throw
        | else  // 'throw' or 'zero'
            data each d
                if (isGroupBy && (d;groupBy isNullish))
                    + 'missing 'groupByDim' value' \Error throw
                if (isVble && (d;vble isNullish) && (missing != 'zero'))
                    + 'missing 'vbleDim' value' \Error throw
                if (d;stack isNullish)
                    + 'missing 'stack' value' \Error throw
        
        // get wide data for d3.stack
        groupInfo = @
        getWideRow = fun gArray gInfo
            groupInfo ~push gInfo
            obj = #
            if isVble
                gArray each row
                    obj : row;stack = row;vble
            | else  // count
                gArray groupCount stack
                    fun subCount subName
                        obj : subName = subCount 
            obj
        wideData = 
            if isGroupBy
                if isBinning
                    tp ~'bin' data groupBy binLimits map row
                        \getWideRow (row : 'bin') row
                | else
                    data group groupBy getWideRow ~values array
            | else
                data \getWideRow @

        // apply d3.stack
        validOrder = @@ 'appearance' 'insideOut' 'none' 'reverse'
        validOffset = @@ 'expand' 'diverging' 'none' 'silhouette' 'wiggle'
        stackNames = new Set (data pick stack) array
        levels = d3 ~stack
        | ~keys stackNames
        | ~value [a;b ?? 0]  // possible null/undef if missing is 'zero' or if missing rows of data
        | ~'order'
            if (ord == 'asc')  d3,stackOrderAscending
            |  (ord == 'desc') d3,stackOrderDescending
            |  (validOrder ~has ord) (d3 : (+ 'stackOrder'(\capitalize ord)))
            |  else ('invalid stack order' \Error throw)
        | ~offset
            if (validOffset ~has offset) (d3 : (+ 'stackOffset'(\capitalize offset)))
            |  else ('invalid stack offset' \Error throw)
        | call wideData

        // construct result from stacked data
        vbleDimDim = vbleDim + vbleDim
        if returnRows
            result = @
            levels each st i
                st each grp j
                    obj = 
                        # (vbleDimDim) grp,0
                        | (vbleDim) grp,1
                        | fill stackNames;i
                    if isGroupBy
                        if isBinning
                            binProps each p
                                obj;p = groupInfo;j;p
                        | else
                            obj;groupByDim = groupInfo;j
                    result ~push obj
        | else
            result = # (vbleDimDim) (@) (vbleDim) (@) fill (@)
            if isGroupBy
                if isBinning
                    binProps each p
                        result;p = @
                | else
                    result;groupByDim = @
            levels each st i
                st each grp j
                    result;vbleDimDim ~push grp,0
                    result;vbleDim    ~push grp,1
                    result,fill       ~push stackNames;i
                    if isGroupBy
                        if isBinning
                            binProps each p
                                result;p ~push groupInfo;j;p
                        | else
                            result;groupByDim ~push groupInfo;j
        result

    tp,vStack = fun data ops
        \stackData data false ops
    tp,hStack = fun data ops
        \stackData data true ops

// lookup
tp,lookup = fun data key mapFunc
    mf = 
        if (mapFunc isFunction)
            mapFunc
        | (mapFunc isNullish)
            [a]
        | else
            mapFunc = mapFunc \cropTilde
            [a : mapFunc]
    obj = #
    if (key isFunction)
        data each d i
            obj : (\key d i data) = \mf d i data
    | else
        key = key \cropTilde
        data each d i
            obj : d;key = \mf d i data
    obj

// group, groupCount
@ 'group' 'groupCount' each method
    tp;method = fun data rest
        
        if (data isArray !)
            'array expected' \Error throw
        nDim = rest,length
        if (nDim == 0)
            'at least one grouping property/function expected' \Error throw
        
        // group
        result = @
        groupNames = @
        lastIndex = nDim - 1
        props = @
        do nDim i
            p = \cropTilde rest;i
            p isFunction ? (data ~'map' p) (data pick p) some isInfOrNaN ?
                nonFiniteMsg \Error throw
            props;i = p
        groupFunc = fun d i
            if (method == 'groupCount' && (i == lastIndex))
                d groupCount props;i
            | else
                d group props;i
            | each kv
                groupNames;i = kv,0
                if (i == lastIndex)
                    result ~push (groupNames array <~push kv,1)
                | else
                    \groupFunc kv,1 (i + 1)
        \groupFunc data 0
        
        // replace each row of result with an object
        result each row j
            newRow = #
            nDim do i
                newRow : (nDim > 1 ? (+ 'name_'i) 'name') = row;i
            newRow : (method == 'groupCount' ? 'count' 'group') = row;nDim
            result;j = newRow
        result

// facet
tp,facet = fun rest
    if (rest,length > 2)
        data = tp ~'group' rest,0 rest,1
        mapFunc = rest,2
    | else
        data mapFunc @= rest
        if (data isArray !)
            'array expected' \Error throw
    container = $div
    data each row index
        plotObj = new tp
        mapFunc ~'call' plotObj (row : 'group') row,name index
        plotObj ~plot container
    # plot [container \addToTarget a]

// bin, binCount
@ 'bin' 'binCount' each method

    tp;method = fun data rest

        if (data isArray !)
            'array expected' \Error throw
        nDim = rest,length / 2
        if (nDim == 0 || (nDim isInteger !))
            'unexpected number of arguments' \Error throw
        
        // check values and limits
        accessors = @
        limits = @
        lowers = @
        do nDim i
            p = rest : (2 * i) \cropTilde
            accessors;i = p isFunction ? p [a;p]
            v = data map e (accessors ~(i) e)  // accessor not passed index and data
            if (v some [a isFinite !])
                'can only bin finite, numeric values' \Error throw
            mn = v min
            mx = v max
            q = rest : (2 * i + 1)
            if (q isFunction)
                q = \q mn mx v
            if (q isArray ! || (q,length < 2) || (q some [a isFinite !])
            | (q min > mn) || (q max < mx))
                'invalid bin limits' \Error throw
            q = q order
            lowers;i = q ~shift
            limits;i = q     

        // binning
        result = @
        binNames = @
        binFunc = fun d i
            cf = [accessors ~(i) a - b]
            if (method == 'binCount' && (i == (nDim - 1)))
                d binCount limits;i cf
            | else
                d bin limits;i cf
            | each kv
                if (kv,1 isArray && kv,1,length || (kv,1 isNumber && kv,1))
                    binNames;i = kv,0
                    if (i == (nDim - 1))
                        result ~push (binNames array <~push kv,1)
                    | else
                        \binFunc kv,1 (i + 1)
        \binFunc data 0

        // replace each row of result with an object
        binInfo = @
        nDim do i
            m = ##
            suffix = nDim > 1 ? (+ '_'i) '' 
            limits;i each lim j
                lowerLim = j ? (limits;i : (j - 1)) lowers;i
                m ~set lim
                    # (+ 'lower'suffix)  lowerLim
                    | (+ 'upper'suffix)  lim
                    | (+ 'middle'suffix) (lowerLim + lim / 2)
                    | (+ 'range'suffix)  (lim - lowerLim) 
            binInfo;i = m
        result each row j
            newRow = #
            nDim do i
                newRow assign (binInfo;i ~get row;i)
            newRow : (method == 'binCount' ? 'count' 'bin') = row;nDim
            result;j = newRow
        result
    
// range, linSpace
tp,range = fun mn mx step
    mn to mx step array
tp : 'linSpace' = fun mn mx n
    mn linSpace mx n array


// ========== update ==========

// update element
updateElement = fun elm state

    __tp__ #= elm
    type #= __tp__

    // channels
    channels = ##
    __tp__,markUpdate each chFunc
        ch func @= chFunc
        val = 
            if (func,length < 2)  // single-mark type, non-xy channel
                \func state  
            | (singleMarkNames ~has type && (xyChannelNames ~has ch))
                func
            | else  // multi-mark type
                \func elm,__tp__,i state
        if (val isNullish !)
            channels ~set ch val
    channelsHasAnyOf = fun rest
        rest some [channels ~has a]

    // helpers
    updateXY = fun rest
        rest each ch
            if (channels ~has ch)
                __tp__;ch = channels ~get ch \(__tp__ : (+ ch,0'Transform'))
    setFrom__tp__ = fun attrName ch
        if (channels ~has ch)
            elm ~setAttribute attrName __tp__;ch

    // front
    if (channels ~has 'front')
        scope
            front = channels ~get 'front' number
            if (front < 0)
                elm lower
            | (front > 0)
                elm raise

    // listen
    if (channels ~has 'listen')
        channels ~get 'listen' ?
        | (elm ~removeAttribute 'pointer-events')
        | (elm ~setAttribute 'pointer-events' 'none')

    // change transition before any channels that use transition
    scope
        newTransition = false
        @ 'delay' 'duration' 'ease' each ch
            if (channels ~has ch)
                __tp__;ch = channels ~get ch
                newTransition \= true
        if newTransition
            \setTransition elm __tp__,delay __tp__,duration __tp__,ease

    // channels that map directly to an attribute
    channels ~keys each ch
        _attr = defChannels ~get ch : '_attr'
        if _attr
            elm ~setAttribute (_attr == true ? (ch \camelToKebab) _attr) (channels ~get ch)

    // fill and stroke
    if (channels ~has 'fill')
        elm ~setAttribute 'fill' (channels ~get 'fill' \__tp__,colorTransform 'fill')
    if (channels ~has 'stroke')
        elm ~setAttribute 'stroke' (channels ~get 'stroke' \__tp__,colorTransform 'stroke')

    // point
    if (type == 'point')
        if (\channelsHasAnyOf 'x' 'y' 'shape' 'area')
            \updateXY 'x' 'y'
            if (channels ~has 'shape')
                __tp__,shape = channels ~get 'shape' \__tp__,shapeTransform
            if (channels ~has 'area')
                __tp__,area = channels ~get 'area' \__tp__,areaTransform
            __tp__ at (@ 'x' 'y' 'shape' 'area') chg 'path' elm \pointSymbol

    // circle
    | (type == 'circle')
        \updateXY 'x' 'y'
        \setFrom__tp__ 'cx' 'x'
        \setFrom__tp__ 'cy' 'y'
        if (channels ~has 'area')
            elm ~setAttribute 'r'
                channels ~get 'area' \__tp__,areaTransform / Math,PI sqrt

    // text
    | (type == 'text')
        if (\channelsHasAnyOf 'x' 'y' 'rotate')
            \updateXY 'x' 'y'
            if (channels ~has 'rotate')
                __tp__,rotate = channels ~get 'rotate'
            elm \setTextTransform __tp__,x __tp__,y __tp__,rotate
        if (channels ~has 'fontSize')
            elm ~setAttribute 'font-size' (channels ~get 'fontSize' + 'px')
        if (channels ~has 'text')
            elm text (channels ~get 'text')

    // segment
    | (type == 'segment')
        \updateXY 'x' 'y'
        \setFrom__tp__ 'x1' 'x'
        \setFrom__tp__ 'y1' 'y'
        if (channels ~has 'xx')
            elm ~setAttribute 'x2' (channels ~get 'xx' \__tp__,xTransform)
        if (channels ~has 'yy')
            elm ~setAttribute 'y2' (channels ~get 'yy' \__tp__,yTransform)

    // hLink and vLink
    | (type == 'hLink' || (type == 'vLink'))
        if (\channelsHasAnyOf 'x' 'xx' 'y' 'yy')
            \updateXY 'x' 'y' 'xx' 'yy'    
            elm ~setAttribute 'd'
                d3 ~(type == 'hLink' ? 'linkHorizontal' 'linkVertical') call
                    # source (@ __tp__,x  __tp__,y)
                    | target (@ __tp__,xx __tp__,yy)

    // edge
    | (type == 'edge')
        if (\channelsHasAnyOf 'x' 'xx' 'y' 'yy' 'size' 'clockwise')
            \updateXY 'x' 'y' 'xx' 'yy'
            if (channels ~has 'size')
                __tp__,size = channels ~get 'size'
            if (channels ~has 'clockwise')
                __tp__,clockwise = channels ~get 'clockwise' boolean number
            elm ~setAttribute 'd' (\dEdge __tp__)

    // bars
    | (type == 'hBar' || (type == 'vBar'))
        other = type == 'hBar' ? 'xx' 'yy'
        if (\channelsHasAnyOf 'x' 'y' other 'size')
            \updateXY 'x' 'y' other
            if (channels ~has 'size')
                __tp__,size = channels ~get 'size'
            x xx y yy #= __tp__
            if (type == 'hBar')
                h = __tp__ ~heightFunc
                bar = \hBarValues (# attach x xx y h)
            | else
                w = __tp__ ~widthFunc
                bar = \vBarValues (# attach x y yy w)
            elm ~setAttribute 'x' bar,xCorner
            elm ~setAttribute 'y' bar,yCorner
            elm ~setAttribute 'width' bar,width
            elm ~setAttribute 'height' bar,height
        if (channels ~has 'cornerRadius')
            elm ~setAttribute 'rx' (channels ~get 'cornerRadius')

    // rect
    | (type == 'rect')
        scope
            if (channels ~has 'width')
                __tp__,width = channels ~get 'width' \__tp__,widthFunc
                \setFrom__tp__ 'width' 'width'
            if (channels ~has 'height')
                __tp__,height = channels ~get 'height' \__tp__,heightFunc 
                \setFrom__tp__ 'height' 'height'
            if (channels ~has 'x' || (channels ~has 'width'))
                \updateXY 'x'
                x #= __tp__
                elm ~setAttribute 'x'
                    __tp__,corner ?
                    | (__tp__,xReverse ? (x - __tp__,width) x)
                    | (x - (__tp__,width / 2))
            if (channels ~has 'y' || (channels ~has 'height'))
                \updateXY 'y'
                y #= __tp__
                elm ~setAttribute 'y'
                    __tp__,corner ?
                    | (__tp__,yReverse ? y (y - __tp__,height))
                    | (y - (__tp__,height / 2))
            if (channels ~has 'cornerRadius')
                elm ~setAttribute 'rx' (channels ~get 'cornerRadius')

    // path
    | (type == 'path')
        if (channels ~has 'path')
            elm ~setAttribute 'd' (channels ~get 'path')

    // line, hBand or vBand
    | (singleMarkNames ~has type)
        scope
            chUsed = false
            xyChannelNames each ch
                if (channels ~has ch)
                    chUsed \= true
                    f = channels ~get ch
                    __tp__;ch = fun i
                        \f i state \(__tp__ : (+ ch,0'Transform'))
            if chUsed
                elm ~setAttribute 'd' (__tp__ \dLineBand)
    
    undefined

// update plot(s)
updatePlots = fun isMerge args

    // get plot elements
    plotElmts = @@
    args,0 \iterableOfElelements each pe
        oc = pe ?: '__tp__' ?: 'outerContainer'
        if (oc == true)
            plotElmts ~add pe
        | (oc ?: '__tp__' ?: 'outerContainer' == true)
            plotElmts ~add oc

    // update state of plot elements
    newState = args : (args,length - 1)
    plotElmts each pe
        isMerge ?
        | (\merge pe,__tp__,state newState)
        | (pe,__tp__,state = \cloneDeep newState)
    
    // only plot elements passed: update all updatable elements inside each plot
    if (args,length == 2) 
        plotElmts each pe
            pe,__tp__,updatable each elm
                \updateElement elm pe,__tp__,state

    // only update elements that are updatable and in one of the plot elements    
    | else  
        elmts = @@
        args,1 \iterableOfElelements each elm
            if (elm ?: '__tp__' ?: 'markUpdate' ?: 'size')
                elmts ~add elm
        elmts each elm
            oc = elm ?: '__tp__' ?: 'outerContainer'
            if (plotElmts ~has oc)
                \updateElement elm oc,__tp__,state
    undefined

// update method
tp,update = fun rest
    if (rest,length != 2 && (rest,length != 3))
        '2 or 3 arguments expected' \Error throw
    \updatePlots false rest

// mergeUpdate method
tp,mergeUpdate = fun rest
    if (rest,length != 2 && (rest,length != 3))
        '2 or 3 arguments expected' \Error throw
    \updatePlots true rest


// ========== color schemes ==========

// d3.schemeCategory10: https://github.com/d3/d3-scale-chromatic
tp,cat = 
    @ '#1f77b4' '#ff7f0e' '#2ca02c' '#d62728' '#9467bd'
    | '#8c564b' '#e377c2' '#7f7f7f' '#bcbd22' '#17becf'