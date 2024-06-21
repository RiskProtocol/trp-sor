'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MAX_OUT_RATIO = exports.MAX_IN_RATIO = exports.TWOBONE = exports.BONE = void 0;
exports.scale = scale;
exports.bnum = bnum;
exports.calcOutGivenIn = calcOutGivenIn;
exports.calcInGivenOut = calcInGivenOut;
exports.calcSpotPrice = calcSpotPrice;
exports.bmul = bmul;
exports.bdiv = bdiv;
exports.btoi = btoi;
exports.bfloor = bfloor;
exports.bsubSign = bsubSign;
exports.bpow = bpow;
const bignumber_1 = require('./utils/bignumber');
exports.BONE = new bignumber_1.BigNumber(10).pow(18);
exports.TWOBONE = exports.BONE.times(new bignumber_1.BigNumber(2));
const BPOW_PRECISION = exports.BONE.idiv(new bignumber_1.BigNumber(10).pow(10));
exports.MAX_IN_RATIO = exports.BONE.times(
    new bignumber_1.BigNumber(0.499999999999999)
); // Leave some room for bignumber rounding errors
exports.MAX_OUT_RATIO = exports.BONE.times(
    new bignumber_1.BigNumber(0.333333333333333)
); // Leave some room for bignumber rounding errors
function scale(input, decimalPlaces) {
    const scalePow = new bignumber_1.BigNumber(decimalPlaces.toString());
    const scaleMul = new bignumber_1.BigNumber(10).pow(scalePow);
    return input.times(scaleMul);
}
function bnum(val) {
    return new bignumber_1.BigNumber(val.toString());
}
function calcOutGivenIn(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    tokenAmountIn,
    swapFee
) {
    let weightRatio = bdiv(tokenWeightIn, tokenWeightOut);
    let adjustedIn = exports.BONE.minus(swapFee);
    adjustedIn = bmul(tokenAmountIn, adjustedIn);
    let y = bdiv(tokenBalanceIn, tokenBalanceIn.plus(adjustedIn));
    let foo = bpow(y, weightRatio);
    let bar = exports.BONE.minus(foo);
    let tokenAmountOut = bmul(tokenBalanceOut, bar);
    return tokenAmountOut;
}
function calcInGivenOut(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    tokenAmountOut,
    swapFee
) {
    let weightRatio = bdiv(tokenWeightOut, tokenWeightIn);
    let diff = tokenBalanceOut.minus(tokenAmountOut);
    let y = bdiv(tokenBalanceOut, diff);
    let foo = bpow(y, weightRatio);
    foo = foo.minus(exports.BONE);
    let tokenAmountIn = exports.BONE.minus(swapFee);
    tokenAmountIn = bdiv(bmul(tokenBalanceIn, foo), tokenAmountIn);
    return tokenAmountIn;
}
function calcSpotPrice(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    swapFee
) {
    const numer = bdiv(tokenBalanceIn, tokenWeightIn);
    const denom = bdiv(tokenBalanceOut, tokenWeightOut);
    const ratio = bdiv(numer, denom);
    const scale = bdiv(exports.BONE, bsubSign(exports.BONE, swapFee).res);
    return bmul(ratio, scale);
}
function bmul(a, b) {
    let c0 = a.times(b);
    let c1 = c0.plus(exports.BONE.div(new bignumber_1.BigNumber(2)));
    let c2 = c1.idiv(exports.BONE);
    return c2;
}
function bdiv(a, b) {
    let c0 = a.times(exports.BONE);
    let c1 = c0.plus(b.div(new bignumber_1.BigNumber(2)));
    let c2 = c1.idiv(b);
    return c2;
}
function btoi(a) {
    return a.idiv(exports.BONE);
}
function bfloor(a) {
    return btoi(a).times(exports.BONE);
}
function bsubSign(a, b) {
    if (a.gte(b)) {
        let res = a.minus(b);
        let bool = false;
        return { res, bool };
    } else {
        let res = b.minus(a);
        let bool = true;
        return { res, bool };
    }
}
function bpowi(a, n) {
    let z = !n
        .modulo(new bignumber_1.BigNumber(2))
        .eq(new bignumber_1.BigNumber(0))
        ? a
        : exports.BONE;
    for (
        n = n.idiv(new bignumber_1.BigNumber(2));
        !n.eq(new bignumber_1.BigNumber(0));
        n = n.idiv(new bignumber_1.BigNumber(2))
    ) {
        a = bmul(a, a);
        if (
            !n
                .modulo(new bignumber_1.BigNumber(2))
                .eq(new bignumber_1.BigNumber(0))
        ) {
            z = bmul(z, a);
        }
    }
    return z;
}
function bpow(base, exp) {
    let whole = bfloor(exp);
    let remain = exp.minus(whole);
    let wholePow = bpowi(base, btoi(whole));
    if (remain.eq(new bignumber_1.BigNumber(0))) {
        return wholePow;
    }
    let partialResult = bpowApprox(base, remain, BPOW_PRECISION);
    return bmul(wholePow, partialResult);
}
function bpowApprox(base, exp, precision) {
    let a = exp;
    let { res: x, bool: xneg } = bsubSign(base, exports.BONE);
    let term = exports.BONE;
    let sum = term;
    let negative = false;
    for (let i = 1; term.gte(precision); i++) {
        let bigK = new bignumber_1.BigNumber(i).times(exports.BONE);
        let { res: c, bool: cneg } = bsubSign(a, bigK.minus(exports.BONE));
        term = bmul(term, bmul(c, x));
        term = bdiv(term, bigK);
        if (term.eq(new bignumber_1.BigNumber(0))) break;
        if (xneg) negative = !negative;
        if (cneg) negative = !negative;
        if (negative) {
            sum = sum.minus(term);
        } else {
            sum = sum.plus(term);
        }
    }
    return sum;
}
