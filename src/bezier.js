import * as V from './v.js';

const CURVETIME_EPSILON = 1e-4; // true curvetime epsilon is ie-8, but this is (generally) close enough for pixel precision

const lerp = (start, end, t) => start + (end - start) * t;
const progress = (v, min, max) => (v - min) / (max - min);

// class for getting info about the bezier curve
export class BezierCurve {
    constructor(p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y) {
        Object.assign(this, {
            p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y,
        });
        this._length = 0;
        this._tLengths = [];
        this._initLengths();
    }

    get length() { return this._length; }

    getPointAt(t) {
        t = Math.min(Math.max(t, 0), 1);
        const { p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y } = this;
        const omt = 1 - t;
        const x = (omt ** 3 * p0x) + (3 * omt ** 2 * t * c0x) + (3 * omt * t ** 2 * c1x) + (t ** 3 * p1x);
        const y = (omt ** 3 * p0y) + (3 * omt ** 2 * t * c0y) + (3 * omt * t ** 2 * c1y) + (t ** 3 * p1y);
        return [x, y];
    }

    getWeightedTangentAt(t) {
        t = Math.min(Math.max(t, 0), 1);
        const { p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y } = this;
        const omt = 1 - t;
        //first derivative of bezier
        const x = (3 * omt ** 2 * (c0x - p0x)) + (6 * omt * t * (c1x - c0x)) + (3 * t ** 2 * (p1x - c1x));
        const y = (3 * omt ** 2 * (c0y - p0y)) + (6 * omt * t * (c1y - c0y)) + (3 * t ** 2 * (p1y - c1y));
        return [x, y];
    }

    getWeightedNormalAt(t) {
        t = Math.min(Math.max(t, 0), 1);
        const tangent = this.getWeightedTangentAt(t);
        return [-tangent[1], tangent[0]];
    }

    getTangentAt(t) {
        return V.normalize(this.getWeightedTangentAt(t));
    }

    getNormalAt(t) {
        return V.normalize(this.getWeightedNormalAt(t));
    }

    getTAtNormalizedLength(nLength) {
        if (nLength <= 0) return 0;
        if (nLength >= 1) return 1;
        return this.getTAtLength(nLength * this.length);
    }

    getTAtLength(len) {
        if (len <= 0) return 0;
        if (len >= this.length) return 1;

        let lastTLength = this._tLengths[0];
        let accumulatedLength = lastTLength[1];
        let lastAccumulatedLength = accumulatedLength;
        for (let i = 1; i < this._tLengths.length; i++) {
            const tLength = this._tLengths[i];

            accumulatedLength += tLength[1];

            if (accumulatedLength > len) {
                const prog = (len - lastAccumulatedLength) / (accumulatedLength - lastAccumulatedLength);
                const t = lerp(lastTLength[0], tLength[0], prog);
                return t;
            }

            lastTLength = tLength;
            lastAccumulatedLength = accumulatedLength;
        }
    }

    // Look for two cached T-lengths, one on either side of `t`. Lerp between them. tLengths are assumed to be sorted in ascending T order
    getLengthAt(t) {
        if (t <= 0) return 0;
        if (t >= 1) return this.length;

        let lastTLength = this._tLengths[0];
        let accumulatedLength = lastTLength[1];
        let lastAccumulatedLength = accumulatedLength;
        for (let i = 1; i < this._tLengths.length; i++) {
            const tLength = this._tLengths[i];

            accumulatedLength += tLength[1];

            if (tLength[0] > t) {
                const prog = (t - lastTLength[0]) / (tLength[0] - lastTLength[0]);
                const length = lerp(lastAccumulatedLength, accumulatedLength, prog);
                return length;
            }

            lastTLength = tLength;
            lastAccumulatedLength = accumulatedLength;
        }
    }

    getNormalizedLengthAt(t) {
        return this.getLengthAt(t) / this.length;
    }

    // Cache a number of roughly equidistant lengths
    _initLengths() {
        const tLengths = [];

        const minLen = 0.05;
        // TODO: not quite sure why the loop is happening exactly 1000 times here,
        const incrementT = 0.006;
        let totalLength = 0;

        let lastPoint = this.getPointAt(0);
        let t = incrementT;
        while (true) {
            if (t >= 1) t = 1;
            const pt = this.getPointAt(t);
            const len = V.distance(pt, lastPoint);
            if (len >= minLen) {
                tLengths.push([t, len]);
                totalLength += len;
                lastPoint = pt;
            }
            if (t >= 1) break;
            t += incrementT;
        }

        this._tLengths = tLengths;
        this._length = totalLength;
    }

    getSvgPathData() {
        const { p0x, p0y, c0x, c0y, c1x, c1y, p1x, p1y } = this;
        return `M${p0x},${p0y} C${c0x},${c0y} ${c1x},${c1y} ${p1x},${p1y}`;
    }

    getNearestTInWindingOrder(currentT, pt) {
        //current point
        const cp = this.getPointAt(currentT);
        //tangent at current point
        const cTan = this.getTangentAt(currentT);
        //vector between current point and requested point
        const pm = V.subtract(pt, cp);
        //projection of target vector onto tangent at current point
        const cd = V.dot(pm, cTan);
        //sign of projection indicating forwared or backward direction
        const scd = Math.sign(cd);

        let increment = 0.01 * scd;
        let lowT = currentT;
        let lowD = cd;
        let highT = lowT;
        let highD = lowD;

        // breadth-first search:
        // step incrementally in the same winding direction as the projection until 
        // the direction's (d) sign switches, indicating that we have found a point 
        // on either side of where the thumb should be
        while (Math.sign(highD) === scd) {
            lowT = highT;
            lowD = highD;
            highT = Math.min(Math.max(highT + increment, 0), 1);
            //do nothing if we're at the edges
            if (lowT === highT) {
                highD = lowD;
                break;
            }
            const highP = this.getPointAt(highT);
            const highTan = this.getTangentAt(highT);
            const highPm = V.subtract(pt, highP);
            highD = V.dot(highTan, highPm);
        }

        // find the new "curvetime (t)"
        let nt;
        let nd;
        if (Math.abs(highT - lowT) < CURVETIME_EPSILON) {

            // if we're close enough
            nt = highT;
            nd = highD;

        } else {

            //binary search between the last two curvetimes checked to get an exact point
            let midT = lowT;
            let midD = lowD;
            while (Math.abs(midD) >= CURVETIME_EPSILON) {
                midT = (lowT + highT) / 2;
                const midP = this.getPointAt(midT);
                const midTan = this.getTangentAt(midT);
                const midPm = V.subtract(pt, midP);
                midD = V.dot(midTan, midPm);
                if (midD * -scd < 0) {
                    lowT = midT;
                    lowD = midD;
                } else {
                    highT = midT;
                    highD = midD;
                }
            }
            nt = midT;
            nd = midD;
        }

        return nt;
    }
}

// TODO: bezier spline to allow multiple curves to be joined together
// class BezierSpline {
// }