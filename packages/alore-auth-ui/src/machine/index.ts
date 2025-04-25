// @ts-nocheck
/* eslint-disable no-unused-vars */
import { assign, createMachine, interpret, State } from 'xstate';

import { AuthMachineContext, AuthMachineEvents, AuthMachineServices } from './types';

const initialContext: AuthMachineContext = {
  salt: undefined,
  error: undefined,
  active2fa: undefined,
  sessionId: undefined,
  registerUser: undefined,
  socialProviderRegisterUser: undefined,
  googleOtpCode: undefined,
  googleUser: undefined,
  sessionUser: undefined,
  forgeData: undefined,
  CCRPublicKey: undefined,
  RCRPublicKey: undefined,
};

export const authMachine = createMachine(
  {
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-Eg5p6C5AoJ2bsNAADSVAJKQTjM3WCf1kzOlePoNc+ozABjsEuQatwLL6D0F3N0jxnQjEji-Ryb8P6JHnuQWhPJezZAABJAVAjeDgG9V7b3oepNqTMqReHeDqTwPh3gjHzDwncuhVyLiPsgkI1gxF4IkQQ4g0iF5kHbDGZeEEYx0JOAw1uCF2bpjdNYXoa53CBG9LqAwOhgjGE8H0fUeh-CtEcTNfBUi57uNyAOASuR2DMCoIwLejAuw9n7BQIc2i3bJiaCwgI7dgy6kCOYoY2l1AtBCJ8Vc8oCKhhwQXJxCRJEkDceyLkPJMhASUWU8hVDVI1MYQhIwegvC2BLAI4EjxtLehGHw7S3QiQ0hBBs9Jk9nFZJkV-Zeq85kVMHIwbADBFGsGqf4nR7sUyGBdPhSUt9SzkgIns4IzQBGPHlPqI+wJwiDKPBky5YzsmL1uWQh5VSnkvLeUcD5tSEJaElOMCYJgOi2BBOoPZoS8IpPsLqJU25zlXVGa45FNzN73L7I8559BXlDgMLi5Zml9TyjwrqUsntDJym4UMfozoARWBCJYX2U5BbjyRgbZl4ydDSCgMQXsMhMD8mQLAWAKVop-iyDQZR5TKHUJ8VBMBujEAn38HE+UntyTOjeE0bC3Rmj+BzDqSwJZsE2SGQikZLitU6r1Qao1JqzVkBArkZgFDHVfM6CKuUvgUlUkMOfCGfqHg2F1B0OlaS4UTyZVG5F2rQqxqwPG01YBoo2oWYwdgHZGA0AFPyVsXB3m2kCZpV4wRvArleAI+GrwBgQ0lFfPQoI9xmOJJORlGqa0yPzjQPAj4wBgE-ha9IVqOXtrkemphY0AQfAmNod4hlEFBzdCNKkh9uiGFxKq5+wydCatrdCHde6D1kDbXaztTAe38j7aQqgg7XaCoBtfe4K47i4gIrqYM2FAi6DhgEMw1iBB6HXdRP9W6AO7v3Z-JELAOADj2BwAofJ0inuoRe-FoJmgdFQt1Kkt9OgqkdCWloaz6mdFxGmYjmSkVbr2k+MgR6T2gZob46CSzh0Ay3LEzB2laXw3JNhbQfpLAbm7v4bocpJOIpZTJzOcmlMdq7ZB6DA62MjuBJ0hJLw3jERnRfKkLQ-k0hPnSIIj8w3wouZGq5C9f31WQJxJtZqaD1pA-MsDjne39tg65jTbpdBH0eD00sCSBFYd8OMKcpjtJNEgZZqL0mYtvwagl41zbnDJd1UmlNaa1O7yFezcY-gCIWXMNoYwFKIavoBDOk+ayj5Hzq7F6LkbmuJZbR1w9uxFNpeUw63r4D6g7inHE8b7DPZ2EXdKx0YTeaWA8BuEEioiOVvVSRqNzLsBgCwBICANAwALxPPINldybWVLgy3PrECBFac9gRecxXH1YkVLErubNtLw0VM6RbmqPtfcwD9v7APRRddTTl+obQoF5hSeqNMLw9ld06e0V9MxUIMhe1HKTri93oE8mAFIfkaDxfQBrNYdUdZqo51ZnQ3Pef88-ILzi6A65xe+kIMniA2hdwBMCUJntULGD2ZOLwJb6lBHG8HbHUaZeED5wLoXGcs46BzugE6j4zoS-EfVrnX3Zd28V8rx28hnYCvU+T-o6ZAi3HsYqUss6hiGE4zqHw-Qj65gsJbrJvEMBNrPE+CAJOesh8h+Tk+zRXgjzCWb70aZOms1uGuE5yCM9Iqz+gHPeeC84qHcXjXN7qX9G0B0ywAmEAbhGoqz13UAjDebyy1v7fHz57YNgfky8uCME8ZybxFopmqaLwdjXipmg5lLB02VIw9mEjwnSDotwj5irC0LcNkWlst74m31rufF+CWEqJXbfju8D8EAPhDBvYmhgRcxPMJshg7BeYqR4YkktAuhNBZ945TY-J8gXERd4p7ZkpUpcEI1X9XEHozZMCP4A8G4g8m598nUEA1w-BRpUxnRAh8IQg49EBfBmhb45RtRIDPZH8Pcf1NUSCMCsDYpRdcDxdv1CDhCE5SCXEKDVcu94NQ9EAu4fBvBugQhSx9QC0YCNCUlxsUlb5DEqRUCRDPwyDCFxCcDtZ8Dn9q0pELCoArDiBFDG41d+VADaD1CxgaRgxuo-Bgg2ksQdCARyQ7BuojACIzD2dPciC0Cy4XCxDNYxd7CItHCxlnDXD3CqC1d1AaCvk1wKQ8wklyVeg+4sRmZ9BV13BupDB+DzC5DRCP4HcDojoXc85BCZCo1siFDPpKDiBg9vCvlhtmg8QSxJgRgpxoC1DtJNQjBSw1lb5-BjBUDYBUA8A8A4BYAvJUBOJXDKAqAmxERlEU0ikewSlWAqE98Ri25b4Sx5UT5fBiQkl8JvQUkxhp8Ht8JZgzB1iJAlYzxkA9104fw-wAJu1ewaMBxSh9taDfBeg8JtxDD+M78PjPYdAmhF1vUdw6QLIASgSQSwB05eQ6BGBFESEBxewSFikaY6Z4Svk7gNwAQYk1lFwpxEc6CBE4lESSxtw78OhCT0BgTQTsZO9GTkwbB+gWgcw9xgw4Z9QPiwkHhZs0xehuhPZYVwsq0N0nDmjPw1ZcZyAbCtY8D84Mi9SsiDSoAjSfswBcihjqC7iEILtYl3QNlekIVlT1lWhgiPBtxYidTXtOdEjE47S8ZsCzSpCCCX9ZD0DDTsZjTHTmobQVCe9R9yRdBOppgQ1KiEATARoBF-BZVYZJgBDpC4zeibSIzyBZNs4OjXd3dKzMjiCaykz7SUznT0ygDETkN25txtIXgPBq8dQsSddmZyyQRQ0n9LS3spFMAQSIBRSSTxSyTikaBWAmx6AaTqBGB6T1cCz8TRokkeZhtZxvQhzNRxsSxVxu5084ihCo1FzF8Vz04CY-8KToTcheQeVDy+TRodlyi0wj5vQjtxhJxTytRQRHtUCXzlziT05k1SdJSEIu5zBRUjAJhj4pwrsEBLBTI-ALIPgQgFSZzuiqypFSAzwBxbdtjvwOAITAJYSBJ0gikYS4TCjkwNwvZQQNxAitTZjR9-N2ZdD+CjsHzgzJcvcdBqLaL+d6LEQqB2ABwOL-yzBOkjtF1ghsQQjEIYLRp4YdwtAPgNxCMmiEzzZ7Soy0iLTdT5zrTLLkyBilDULNIekvAzdVxnRYd8zhy4lQQUkpwu5PYpwLKkjjS2iGzc43c7KQypdnDnLcDA8nS1c3KAYx9GcJVzBUI6RUJDd9QHg8QNxYFTDUC91YAD0IAZZ5AvJCA3dBiVYbLJD0j7LQyKqqqariA6qGrRQVYuy0quLXS9x7gqQtBiIHtOg9kpUAQVxeg-Tgw11HyeipEMYuJ04lKVK1L0r6gp1pRY9IK6RniuS5Q5U9MEk3Rkk3RUC1rVZxSPyiZKZZJ9zaZDyWC-RCNb5gQLrAgTr9d9B79JRsNyR+gbq05xTkLC8XTNJzAzAsTiRbAIUfjL9QRZSepPBgxPBnspL4j4ykibZxTTTbKKLWywyzYCbkABr-y6QRpPhAVMJjkR9twGlb86RQQ-UAhwrE4KaoqndGyuiWyrS2zLKKaqadrEAWCRoj57AtACLXRprF0aiJg6jCMxMKzYzSaOriBqqnpSpIqiaWq4rpKEitadb-Jnokr65XKhrNJsxdBHg-YfA746ceFD4KsqQQshzqsuazZFEzxcglhmq7CjbcbqzLK-aA6sAxabaMqVw-QcwcwXVw93AwK4bpS9xOTtJVkfa-II7A6Dbg6Sahaybc7-algqa0yIcgC6Uxgdw7gQQliatU77h06CIehARsbZy2qEqbS86sBebncmyQ6nz9Tw6y6o6XKPD-yr1JRgxvUJgSwhKPgvBgQsz-BfYoUUDlrKKxkvIvtYQoAmwnwYABxGp1YC7zSi6HLXE970AD6j7HwT6z7o7oaNMAwAbPhLEj9YYPiQh4aPhJhJwgq3hUDb777j6wBT70B1Z6y+aYrmyNbi6wHVhD6IGoHKbJ68jDznR-MrB68pjcxStBppTwicTug2bSwt6caR7HKkjOQJB34F5DiL6YyHDi7nD6HGGwAcjMHUrDzijpRPAjAdQcJp9KU1lvY5QjFPAdxcwc7PxOGoAmGsDYHB6BbEHr6S6FGGGlHuH+jkrBjhiezaCCJAhRpF7zN6QrBKUiR9BbgZ0Fwj51a2HNGoAdHlHWiWHWr4qZK3GuGeGDHrbX76hfYZT7tMwE7iQTqXUWhVweDxq8M1jt7Sa-HdHmHUjDar7QzUmPGSAK6Y6Qn+TvA3g9xNSkkjkQUj4HggVDBvVDAjBUCcm9HWjVH+bYqsmpcmmAmrap7xbgDQs4lfY-VTNHgQViR9BLAuMbAgQklyqfcbc5dzY908ZiBZB4sKBmAKAg7L7BbNHrdbdy5lmD01nOINmKAX7jHRinhRoT9F1iUyU9lSnx00wP195bA5mecFmZYjnVnCB1nNmB62mEGXH2r5mDmlnIBjm-nTnNmLmq6THrnqckl68El8qeFF1OlCNUdPh9IsL1j61vnIXfn-mtmFNrUdt7UADLm6kRrRozNnRzAcx+hfUKROhSx+klVSV8XdVCWVmTmzmJSCm1DWcsSQ0cwEkyxNBHmcxVSdR3hzMxrO6OmZKY1eWoWSXO9K6AkMykkkSghSndWj5b49kzAwVOgT5fZlRxruXiA1XiWYWtn7NwNu1MsYNwdtWgCiQmh9A6QatJhLr2DAZtw6XyRirvNyLdnQzVXDmiX+WAWnWMsoMsshwtXPlkxQneYYF8QTIghA3HhJwiVQ28xJhbF5GoAKAwAwpYB0ACp+RUBLwQo8AKEW1mAfmTntnWG5zQznCK2q2a3Hw62G3CAm2W223oW4WPWTG8H+EFQKcjqpW50NQiRByBFVwSVtSu6fGEie3K3CBq3a363G3m3nBW3Y3oWO3vHja8bE5e293+3B2j3R2z34t8ngmNdUXdJIUXnlVjIdI9Rc3OXXhnGu2e7LLb392B3D3h3j3T2+Xz2vHh6VraGb3d2IOH3oOn24OX3eHmovDqWgkzBB5pTCyPAdw9LghcIrAuFNlxsy3wP72oOR2T2x34sL3EOd7hakj6OD2h2mPYP1XOIqaCi326DCNpRzA3QnhdQwkhLIYvAljWZiQjKv0NHu2bTuPIPeOYOWPOJAX4H2PSad2+2ePH3mPn3BOcPuz4XRi5RRrLW0xJxuoklfVuhBnAyBTtw-BgPu6ZKjO72TOMOzOsPdPWn9PlXt31PUOGOtPMOBPX38OhUqPtdFQ8MaaXaZUAisTmT4DQQhHvOt291jPnxWUrVWBoTAFsAaAnk3kCh+GVjrzUcdwpGR81QvrBnFQVUrAonJLN3jbCv-Pivrk6Atq-5j16AKBcgcgOBJJpJZJDyyU-CKiixBFwDlx8JpRQUhzJhPjFt+uIPxkyBcl8lClilSlQdBx+H3BszmYrBUJI9A2bhuoPMTAPAYVU98JduouCoDu5EZkeUVEwJ15N4tEhXEJfAxgP1ghAUaQb16dcIYEvPJwpQu5PuiuDukQf5RuAFhJgFhJ5vAhpRekfBIKZguSbhbFvBQggxZxl7UeBuDvN9vFz0+nT5GdAhDBdxymHuVwGCNkBEsFg53g6f9v+3WJYBsAftWPmBoxySKuqvsAav8h5vPgRpfjWg1lymVxlwzA-QrGCIoighObkmDY9v+3tVOrdauI2PwvTfvvKrtbipnoJ2020L70sSRERthtmXBobhJjzGrudd9QDRjfqJbfnx7ezamrQvOj2nI3HIw-zeHfLeLPAnenQf9evAOhc0aVcRue1lpR79LFn0OeeubevvnxbqBJ4s55Bif9CYJInqle+mF7-VTF6RbgL8fedlkMAxcxXgNxCPhezfK-q+IBa-IbLuXh4brE56OYWv+gMK0wQQhH+-h8h-vuR+Qox-idNrVK2BYT+G7AcN4ZbhNdcwteu+UlRq0xgqCfzB1-S5ubnpre4+EgE-nD+rLPBqRORsxg7vcKr+swZcHPRlA+BAQbwdUA-y0bm1SoL-VTvH3L7QDP+qfLBqmzxQw1O47vcPGuEurwxtehGWJp8Gxb7J3mIfKeO-xtJNUEOZfNHh-yd5f8+AeHazlKVQwAhGkXcbbjdm157hi0PFa+MNhMBQC6BsA6PkPRoH09hBXEZ3ugIBiBpxiPSQwrYjXBrcKQn1bQB8DbpAMoBFGRqGAAXxL5WAK+NfMUix7jdJu6QDgG9TEza5HgJkdbm6GXApcsSjwN4EFTAEMoyBCAtHjoJrb6CC8VxRgOkAHDLw3q2gWJDmhVTGITAwKH3h4EVCjRSwqCaWl9W0F7pdBfgifn00XSgE-A9jQjI0mNaxD8h3gSUE7S3BHwbA2giQKxEOhfY-I9HR8LX2oGv9pciA18DUIXiyBPwDQwYtIIQy7Vgwi3TQcyQH6OCbA46EbEQN3BaAqhHQuod0Ki6NDicog9RiCy8H092htQroeW0WG9CGBWQyrOMBXDMISUgZYASHEgIrgFwdwCtNQ0IIJ9UAlVR8Ke10H55qAJxWgGcWYAXEquW8G4v+RGAjQaaFkW+HlX8DACl2JgZdAjSnRQDTa9Q3YX1Wf7ND4Bb-RAfCIWF9slhFwZAT0ywYs81wYwN0HE0VBBBbgjg3UP6DZYPEcqkoKAV0xSISFC6LQhPgyPIL7DQeytP-vwSMBT5mCwA4MMU0go7gJW7gFTmsLRFo82R1hDJsyNRGtCpR7jZpnkwYFoD+hiACYN1BPJtBAyM4MwNrzuCGUgaq4f-t0HpFKjDiKw2PvKNZEWj9GeIvhiz34yxMr+MMREoHF+BphmgOobZKYn6DTk4RYLRZt8K2YoiJRCo+nvs2DGwsORP-bynhFaCfUY8mNAsCfk0Izp74QDJViyPRFBiZYALK0cCxA6SjIxeY8uDGJQGOjORsObwB7QH4ghVwBuH3irziQzpqcLwIgUkzuEv4E+TWeLCGI2zyYts5LHsO2lMF48+m3UcbOETsA9JpOw+AsK0E6TBh3g+GGnk6CgF9jOIA4lLAmwgyusXMfTfXCjmYTmAlx9jAsCRRKHs1yQkMI3t2Kui9i4s24zZoOL3Eusk2brZQswJWQLgaiOoEtuKi9A+8cBAIXQvfDeAx4qGvXeIk+Oaw7jOsmQ0HlOOXHvo5x7wBcbEJ0gPEFwq4QjH0ny59dEBW4s5oOLJYsYJIP5P8pOJDR0sOxCNNoFggLCSgUEpKExDAkMgOJPBJY-biRNfEpZIaAQoISEMnGghUJs4hQfAXn7HZnQPSOkOuKDIwSf0cEkloOPXJAJNmVASbsUnOKsBeQnARgCBF-IOYmAzPZCfwX9AYZ+S86cwAWDTCeUPQ+iHmAtm4kRj9uwJc4J+AfoCsAEJCNFLan-y3EEuGmXLnEnrqG812zobCNKG2Szj-AGdGwOKOLFuSzeEfPyOhzwD8d7WcA8MQnzSmfgMpWUk5n0NUIFlDhwaU8sSFpRCVVAGOLLmKwX7lgkpPnFKXbwt5QBCpOnPTjHyLEtS8p7UzqeZxKkZk6QLJLznrjaD6s9KqgKdHhFu75pc0o8B8Sb1zFFdPs32X7P9lygXBgc-ksHIeW0jAhzGt6HjICEcE8k7yrQLBLAhcnLTQ+q0gbutPxybSicO03yaQgom-wqA-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-CyNmAc5nZWlpYVUuNTub7gcl4g-bsii-VAN+EqeaIVfwCUaE56YmGkFnUY2hz6eovcXpL04iq63Q5jXxc+i7V4VCwf9UFeUzTydBFdRu-bhbJVj1yHl-QKYC8DvTvEu+wVCZjdkhSKptIUAzfjX0hzXaQmsBdpQqChEU5ue0zfhO8AmCThyNoiYXRIMoEBa2N0zPwovK+p3BegAS2+LNV6BoR9EhGdTblLaFpDfB56pLfhOgSEYnOJWN4GMNGouDSRfgMlLjvuFtDqhWwhEViMGKyy3gnSKUHopFGrgu9zgkbEuJMpCls9+3R4QVHznMrCtqCa8hazFFU6bgpI0VjoVeBBFfAuq5SbmItk9CkRpUL9aUP4SQ6IBGcgJeMNZz1JaR0tc0f4wQ0k7WChlbjXDDFb4C-CRIYEIInnWu6zZ4s2HSGJ-6wJRohHekHUU76qhE6-oHUCNW0gxbNxz4hCVdpkESgnm4uznkER8CLjcGmENcZrMUlK6zefEigBtnDWPESDh0sg5AtRrq8Lq8MaWjzCgEeTth3kzZswZwyuC2DUun3u8G1wBEklhgVWrXopl+zdZgc+1rLMlD3A9wl2CAqZRa48GZQGE2AjMEMCwzHp8Ml6QOoIPqiEAR+IkSxPmyvdpJWuOoq0BP5Qpalq+s3suuJ2-Ldq7CQbLdwwwMsHuC9LEoCHEq+AzFUA8OVbMjms7CtTao4YnVlo+6k5UPWsXOpVUeAoBOchNE+1eFFz0AJcsuUsArmvDX6TEMQGoEI6jQr+tKZfgEHMQLwlYveLUYko5h2bwYl4UuUxFYhVGQQNR4aC91pBRIQAnkKAJgDXXAEOBdjfSDTQnROAzwc8LAFiBBBOBMAYAUKBMY1zmJycvGGY+0fz7bLVA1RtvcqDBCcqFDSix+lguYWL511sSRpdoGaXEhmJ0wRgjrh0qgoBEki649IuQUq6SdZjcssFTZZMFl5Y6NeadjwyeofjA83+e1Ja0+HQiPJcsjXs7hO07duZGovOgJ4OModjC5ReopfD2k-sqzAZbOAqyrEZOR2fxbENJTYn5Qq6DQSklhM3HrFOC1hU3qRPWGRgEFBAt3Fs7BBDF4QwKuSCGaHHWTfxnBbYrUW3GIAiG-CHEibXjYRG1WJOUv3CJioB8hGCdJKf3k5H2Tv2ORVvu5Ph4paddddrYOc5d9acrCUrXKXnSkQIgQAA */
    id: 'authMachine',

    predictableActionArguments: true,
    tsTypes: {} as import('./index.typegen').Typegen0,

    schema: {
      context: {} as AuthMachineContext,
      services: {} as AuthMachineServices,
      events: {} as AuthMachineEvents,
    },

    states: {
      inactive: {
        on: {
          INITIALIZE: [
            {
              target: 'active.login.fetchingForgeData',
              cond: 'forgeClaim',
            },
            'active',
          ],
        },
        exit: assign({
          error: () => undefined,
          sessionId: () => undefined,
          credentialEmail: () => undefined,
        }),
      },

      active: {
        states: {
          web3Connector: {
            states: {
              connecting: {
                on: {
                  CONFIRM_WEB3_LOGIN: 'emailInput',
                },
              },

              emailInput: {
                on: {
                  VERIFY_EMAIL_ELIGIBILITY: 'verifyingEmailEligibility',
                },
                exit: assign({
                  error: () => undefined,
                }),
                entry: assign({
                  googleOtpCode: () => undefined,
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  socialProviderRegisterUser: () => undefined,
                  salt: () => undefined,
                  sessionId: () => undefined,
                }),
              },

              verifyingEmailEligibility: {
                invoke: {
                  src: 'verifyEmailEligibility',
                  onDone: {
                    target: 'email2faCode',
                    actions: 'setSessionId',
                  },
                  onError: {
                    target: 'emailInput',
                    actions: assign({
                      error: (_, event) => event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              email2faCode: {
                on: {
                  VERIFY_CLAIM_NFT_EMAIL_2FA: 'verifyingClaimNftEmail2fa',
                },
              },

              verifyingClaimNftEmail2fa: {
                invoke: {
                  src: 'verifyClaimNftEmail2fa',
                  onDone: 'emailConfirmed',
                  onError: {
                    target: 'email2faCode',
                    actions: assign({
                      error: (_, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              emailConfirmed: {
                type: 'final',
              },

              idle: {
                on: {
                  SELECT_CONNECTOR: 'connecting',
                },
              },
            },

            initial: 'idle',
          },

          login: {
            states: {
              idle: {
                states: {
                  signWithPasskey: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',

                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },

                      BACK: '#authMachine.active.login.idle.error',
                    },
                  },

                  authScreen: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',

                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },

                      SET_CONDITIONAL_UI_PASSKEY: {
                        target: '#authMachine.active.login.idle.localPasskeySign',
                      },
                    },
                  },

                  error: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },

                  localPasskeySign: {
                    on: {
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },

                      BACK: '#authMachine.active.login.idle.error',
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                    },
                  },
                },
                initial: 'authScreen',

                on: {
                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',
                  GOOGLE_LOGIN: 'googleLogin',
                  ADVANCE_TO_PASSWORD: 'inputPassword',
                  SIGN_IN_WITH_PASSKEY: '#authMachine.active.login.idle.signWithPasskey',

                  SELECT_PASSWORD_METHOD: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        googleOtpCode: () => undefined,
                        googleUser: () => undefined,
                        registerUser: () => undefined,
                        socialProviderRegisterUser: () => undefined,
                        sessionId: () => undefined,
                        CCRPublicKey: () => undefined,
                        RCRPublicKey: () => undefined,
                      }),

                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    {
                      target: 'retrievingCredentialRCR',
                      cond: 'isPasskeyEnabled',
                    },
                    'retrievingSalt',
                  ],
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              loginMethodSelection: {
                on: {
                  SELECT_PASSWORD: 'retrievingSalt',

                  BACK: {
                    target: '#authMachine.active.login',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      socialProviderRegisterUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                },
              },

              retrievingSalt: {
                invoke: {
                  src: 'retrieveSalt',
                  onDone: {
                    target: '#authMachine.active.login.inputPassword',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.login',
                    actions: assign({
                      error: (_context, event) => event.data?.error,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              inputPassword: {
                on: {
                  BACK: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        googleUser: () => undefined,
                        registerUser: () => undefined,
                        socialProviderRegisterUser: () => undefined,
                        error: () => undefined,
                      }),

                      cond: 'isPasskeyEnabled',
                    },
                    'idle',
                  ],

                  COMPLETE_GOOGLE_SIGN_IN: 'verifyingGoogleLogin',
                  VERIFY_LOGIN: 'verifyingLogin',
                },
              },

              verifyingLogin: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: [
                    {
                      target: 'hardware2fa',
                      cond: 'hasHardware2FA',
                      actions: assign({
                        active2fa: (_context, event) => event.data?.active2fa,
                      }),
                    },
                    {
                      target: 'software2fa',
                      cond: 'hasSoftware2FA',
                      actions: assign({
                        active2fa: (_context, event) => event.data?.active2fa,
                      }),
                    },
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    {
                      target: 'email2fa',
                      actions: 'setSessionId',
                    },
                  ],
                  onError: {
                    target: '#authMachine.active.login.inputPassword',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              successfulLogin: {
                type: 'final',

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  socialProviderRegisterUser: () => undefined,
                }),

                on: {
                  REFRESH_ACCESS_TOKEN: {
                    target: 'successfulLogin',
                    actions: 'updateAccessToken',
                  },
                },
              },

              software2fa: {
                on: {
                  CONFIRM_SW_CODE: 'verifying2faCode',
                  USE_HARDWARE_2FA: 'hardware2fa',
                  BACK: {
                    target: 'inputPassword',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              verifying2faCode: {
                invoke: {
                  src: 'verify2faCode',
                  onDone: [
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    { target: 'successfulLogin', actions: 'setSessionUser' },
                  ],
                  onError: {
                    target: 'software2fa',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              hardware2fa: {
                on: {
                  USE_SOFTWARE_2FA: 'software2fa',
                  VERIFY_HW_AUTH: 'verifyingHwAuth',
                  BACK: {
                    target: 'inputPassword',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              newDevice: {
                on: {
                  CONFIRM_DEVICE_CODE: 'verifyingCode',
                  RESEND_CODE: 'resendingConfirmationEmail',
                },
              },

              verifyingCode: {
                invoke: {
                  src: 'verifyDeviceCode',

                  onDone: {
                    target: 'successfulLogin',
                    actions: 'setSessionUser',
                  },

                  onError: {
                    target: 'newDevice',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              resendingConfirmationEmail: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: {
                    target: 'newDevice',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              email2fa: {
                on: {
                  RESEND_CODE: 'resendingEmailCode',
                  VERIFY_EMAIL_2FA: 'verifyingEmail2fa',
                  BACK: {
                    target: 'inputPassword',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              verifyingEmail2fa: {
                invoke: {
                  src: 'verifyEmail2fa',

                  onError: {
                    target: 'email2fa',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },

                  onDone: {
                    target: 'successfulLogin',
                    actions: 'setSessionUser',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              resendingEmailCode: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: {
                    target: 'email2fa',
                    actions: 'setSessionId',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              verifyingHwAuth: {
                invoke: {
                  src: 'authenticateWebauthn',

                  onDone: [
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    { target: 'successfulLogin', actions: 'setSessionUser' },
                  ],

                  onError: {
                    target: 'hardware2fa',
                    actions: assign({
                      error: () => 'Failed authenticating with hardware key',
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              fetchingForgeData: {
                invoke: {
                  src: 'fetchForgeData',
                  onDone: {
                    target: 'idle',
                    actions: assign({
                      forgeData: (_, event) => event.data,
                    }),
                  },
                  onError: 'idle',
                },
              },

              verifyingGoogleLogin: {
                invoke: [
                  {
                    src: 'verifyGoogleLogin',
                    onDone: {
                      target: 'successfulLogin',
                      actions: 'setSessionUser',
                    },
                    onError: {
                      target: 'inputPassword',
                      actions: assign({
                        error: (_context, event) => event.data?.error || event.data?.message,
                      }),
                    },
                  },
                ],
              },

              googleLogin: {
                invoke: {
                  src: 'googleLogin',
                  onDone: [
                    {
                      target: 'idle',

                      actions: assign({
                        socialProviderRegisterUser: (_, event) =>
                          event.data?.socialProviderRegisterUser,
                      }),

                      cond: 'isNewUser',
                    },
                    {
                      target: 'inputPassword',
                      actions: assign({
                        googleOtpCode: (_, event) => event.data.googleOtpCode,
                        salt: (_, event) => event.data.salt,
                        googleUser: (_, event) => event.data.googleUser,
                        sessionId: (_, event) => event.data.sessionId,
                      }),
                    },
                  ],
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  socialProviderRegisterUser: () => undefined,
                }),
              },

              retrievingCredentialRCR: {
                entry: assign({
                  error: () => undefined,
                }),

                invoke: {
                  src: 'startPasskeyAuth',
                  onDone: {
                    target: '#authMachine.active.login.signingCredentialRCR',
                    actions: assign({
                      RCRPublicKey: (_context, event) => event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              signingCredentialRCR: {
                on: {
                  FINISH_PASSKEY_LOGIN:
                    '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                  BACK: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',
                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    'idle.authScreen',
                  ],
                  PASSKEY_NOT_SUPPORTED: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',

                      actions: assign({
                        error: (_, event) => event.payload.error,
                      }),

                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    'idle',
                  ],
                },
              },

              verifyingRegisterPublicKeyCredential: {
                entry: assign({
                  error: () => undefined,
                }),

                invoke: {
                  src: 'finishPasskeyAuth',
                  onDone: [
                    {
                      target: 'hardware2fa',
                      cond: 'hasHardware2FA',
                    },
                    {
                      target: 'software2fa',
                      cond: 'hasSoftware2FA',
                    },
                    {
                      target: 'newDevice',
                      cond: 'isNewDevice',
                    },
                    { target: 'successfulLogin', actions: 'setSessionUser' },
                  ],
                  onError: [
                    {
                      target: '#authMachine.active.login.loginMethodSelection',
                      actions: assign({
                        error: (_context, event) =>
                          event.data?.error || event.data?.message || event.data,
                      }),
                      cond: (context) => !!context.credentialEmail,
                    },
                    {
                      target: '#authMachine.active.login.idle.authScreen',
                      actions: assign({
                        error: (_context, event) =>
                          event.data?.error || event.data?.message || event.data,
                      }),
                      cond: (context) => !context.credentialEmail,
                    },
                  ],
                },
              },
            },

            initial: 'idle',

            on: {
              SETUP_REGISTER_USER: {
                target: '.idle',
                actions: 'setupRegisterUser',
              },

              START_PASSKEY_LOGIN: '.retrievingCredentialRCR',
            },
            entry: assign({
              error: () => undefined,
            }),

            exit: assign({
              RCRPublicKey: () => undefined,
              CCRPublicKey: () => undefined,
              sessionId: () => undefined,
            }),
          },

          register: {
            states: {
              idle: {
                on: {
                  SHOW_TERMS_MODAL: 'termsModal',

                  SEND_REGISTRATION_EMAIL: {
                    target: 'sendingEmail',
                    actions: assign({
                      googleOtpCode: () => undefined,
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      socialProviderRegisterUser: () => undefined,
                    }),
                  },

                  ADVANCE_TO_PASSWORD: 'createPassword',
                  LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',

                  SETUP_REGISTER_USER: {
                    target: 'idle',
                    internal: true,
                    actions: 'setupRegisterUser',
                  },

                  GOOGLE_LOGIN: 'googleLogin',
                },

                exit: assign({
                  error: () => undefined,
                }),
              },

              termsModal: {
                on: {
                  CLOSE_TERMS_MODAL: 'idle',
                },
              },

              sendingEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: 'emailValidation',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                      sessionId: (_context, event) => event.data?.sessionId,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              emailValidation: {
                on: {
                  VERIFY_EMAIL: {
                    target: 'verifyingEmail',
                    actions: assign({
                      registerUser: (_, event) => event.payload?.registerUser,
                    }),
                  },
                  BACK: {
                    target: 'idle',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                  RESEND_CODE: 'resendingRegistrationEmail',
                },
              },

              verifyingEmail: {
                invoke: {
                  src: 'verifyEmail',
                  onDone: [
                    {
                      target: 'registerMethodSelection',
                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    {
                      target: 'retrievingCCR',
                      cond: 'isPasskeyEnabled',
                    },
                    'createPassword',
                  ],
                  onError: {
                    target: 'emailValidation',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              createPassword: {
                on: {
                  COMPLETE_REGISTRATION: 'completingRegistration',
                  BACK_TO_IDLE: {
                    target: 'idle',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      socialProviderRegisterUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                  BACK: {
                    target: '#authMachine.active.login',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
              },

              completingRegistration: {
                invoke: {
                  src: 'completeRegistration',
                  onDone: { target: 'userCreated', actions: 'setSessionUser' },
                  onError: {
                    target: 'createPassword',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              userCreated: {
                type: 'final',

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  socialProviderRegisterUser: () => undefined,
                }),

                on: {
                  REFRESH_ACCESS_TOKEN: {
                    target: 'userCreated',
                    actions: 'updateAccessToken',
                  },
                },
              },

              resendingRegistrationEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: 'emailValidation',
                    actions: 'setSessionId',
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              googleLogin: {
                invoke: {
                  src: 'googleLogin',
                  onDone: [
                    {
                      target: 'createPassword',

                      actions: assign({
                        registerUser: (_, event) => event.data?.registerUser,
                      }),

                      cond: 'isNewUser',
                    },
                    {
                      target: 'idle',
                      actions: assign({
                        googleOtpCode: (_, event) => event.data.googleOtpCode,
                        salt: (_, event) => event.data.salt,
                        googleUser: (_, event) => event.data.googleUser,
                        sessionId: (_, event) => event.data.sessionId,
                      }),
                    },
                  ],
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                  socialProviderRegisterUser: () => undefined,
                }),
              },

              retrievingCCR: {
                entry: assign({
                  error: () => undefined,
                  CCRPublicKey: () => undefined,
                }),
                invoke: {
                  src: 'startRegisterPasskey',

                  onDone: {
                    target: '#authMachine.active.register.localCCRSign',
                    actions: assign({
                      CCRPublicKey: (_context, event) => event.data.ccr,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },

                  onError: {
                    target: 'registerMethodSelection',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              localCCRSign: {
                on: {
                  FINISH_PASSKEY_REGISTER: '#authMachine.active.register.sendingPublicCredential',
                  PASSKEY_NOT_SUPPORTED: [
                    {
                      target: '#authMachine.active.register.registerMethodSelection',

                      actions: assign({
                        error: (_, event) => event.payload.error,
                      }),

                      cond: 'isPasswordAndPasskeyEnabled',
                    },
                    'idle',
                  ],
                  BACK: {
                    target: '#authMachine.active.register.registerMethodSelection',
                  },
                },
              },

              localRCRSign: {
                on: {
                  FINISH_PASSKEY_AUTH: '#authMachine.active.register.sendingAuthPublicCredential',
                  BACK_TO_IDLE: '#authMachine.active.register.idle',
                  USER_CREATE_ACCOUNT_BUT_NOT_LOGIN: 'passkeyCreatedButNotAuthenticated',
                },
              },

              waitingForRCR: {
                on: {
                  START_PASSKEY_LOGIN: '#authMachine.active.register.retrievingRCR',
                },
              },

              sendingPublicCredential: {
                invoke: {
                  src: 'finishRegisterPasskey',
                  onDone: {
                    target: '#authMachine.active.register.waitingForRCR',
                    actions: assign({
                      RCRPublicKey: () => undefined,
                      sessionId: () => undefined,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              registerMethodSelection: {
                on: {
                  SELECT_PASSWORD: 'createPassword',
                  START_PASSKEY_REGISTER: 'retrievingCCR',
                  BACK: {
                    target: 'idle',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      socialProviderRegisterUser: () => undefined,
                      error: () => undefined,
                    }),
                  },
                },
              },

              retrievingRCR: {
                invoke: {
                  src: 'startPasskeyAuth',
                  onDone: {
                    target: '#authMachine.active.register.localRCRSign',
                    actions: assign({
                      RCRPublicKey: (_context, event) => event.data.requestChallengeResponse,
                      sessionId: (_, event) => event.data.sessionId,
                    }),
                  },
                  onError: {
                    target: 'registerMethodSelection',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
              },

              sendingAuthPublicCredential: {
                invoke: {
                  src: 'finishPasskeyAuth',

                  onDone: {
                    target: 'userCreated',
                    actions: 'setSessionUser',
                  },

                  onError: {
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: (_context, event) =>
                      assign({
                        error: event.data?.error || event.data?.message || event.data,
                      }),
                  },
                },
              },

              passkeyCreatedButNotAuthenticated: {
                on: {
                  BACK_TO_IDLE: 'idle',
                },
              },
            },

            initial: 'idle',

            entry: assign({
              error: () => undefined,
            }),
          },

          forgotPassword: {
            states: {
              idle: {
                on: {
                  SEND_CODE: 'sendingCode',
                  RESET_PASSWORD: 'newPassword',
                },
              },

              sendingCode: {
                invoke: {
                  src: 'sendCode',
                  onDone: 'codeSent',
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              codeSent: {},

              newPassword: {
                on: {
                  CONFIRM_PASSWORD: 'savingPassword',
                },
              },

              savingPassword: {
                invoke: {
                  src: 'confirmPassword',
                  onDone: 'passwordSaved',
                  onError: {
                    target: 'newPassword',
                    actions: assign({
                      error: (_context, event) => event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              passwordSaved: {
                type: 'final',
              },
            },

            initial: 'idle',
          },
        },

        initial: 'login',

        on: {
          RESET: 'inactive',
          SIGN_UP: [
            {
              target: '.register',
              cond: 'requireEmailVerification',
            },
            {
              target: '.register.retrievingCCR',
              cond: 'isPasskeyEnabled',
            },
          ],
          LOGIN: '.login',
          FORGOT_PASSWORD: '.forgotPassword',
        },
      },
    },

    initial: 'inactive',

    on: {
      RESET_CONTEXT: {
        target: '.inactive',
        actions: 'clearContext',
      },
    },
  },
  {
    services: {
      async completeRegistration(context, event) {
        throw new Error('Not implemented');
      },
      confirmPassword: async (context, event) => {
        throw new Error('Not implemented');
      },
      sendConfirmationEmail: async (context, event) => {
        throw new Error('Not implemented');
      },
      retrieveSalt: async (context, event) => {
        throw new Error('Not implemented');
      },
      sendCode: async (context, event) => {
        throw new Error('Not implemented');
      },
      startRegisterPasskey: async (context, event) => {
        throw new Error('Not implemented');
      },
      finishRegisterPasskey: async (context, event) => {
        throw new Error('Not implemented');
      },
      finishPasskeyAuth: async (context, event) => {
        throw new Error('Not implemented');
      },
      startPasskeyAuth: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verify2faCode: async (context, event) => {
        throw new Error('Not implemented');
      },
      authenticateWebauthn: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyDeviceCode: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail2fa: async (context, event) => {
        throw new Error('Not implemented');
      },
      verifyEmailEligibility: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyClaimNftEmail2fa: async (context, event) => {
        throw new Error('Not implemented');
      },
      fetchForgeData: async (_, event) => {
        throw new Error('Not implemented');
      },
      googleLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyGoogleLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
    },
    guards: {
      // @ts-ignore
      isNewUser: (_, event) => !!event.data.isNewUser,
      forgeClaim: (_, event) => !!event.forgeId,
      hasHardware2FA: (context, event) => {
        const { data } = event;
        const HARDWARE = 1;
        // @ts-ignore
        if (data?.active2fa)
          // @ts-ignore
          return data?.active2fa?.find((item: any) => item?.twoFaTypeId === HARDWARE);
        return false;
      },
      // eslint-disable-next-line arrow-body-style
      isNewDevice: () => {
        // TODO removed until next-auth is out

        return false;
        // const { data } = event;
        // // @ts-ignore
        // if (data?.error?.includes('Invalid device')) {
        //   return true;
        // }
        // return false;
      },
      hasSoftware2FA: (_, event) => {
        const { data } = event;
        const SOFTWARE = 2;
        // @ts-ignore
        if (data?.active2fa)
          // @ts-ignore
          return data?.active2fa?.find((item: any) => item?.twoFaTypeId === SOFTWARE);
        return false;
      },
    },
    actions: {
      setSessionUser: assign({
        sessionUser: (_, event) => event.data,
      }),
      setupRegisterUser: assign({
        registerUser: (_, event) => event?.registerUser || undefined,
      }),
      clearContext: assign({
        salt: () => undefined,
        error: () => undefined,
        active2fa: () => undefined,
        registerUser: () => undefined,
        googleOtpCode: () => undefined,
        googleUser: () => undefined,
        sessionUser: () => undefined,
        forgeData: () => undefined,
        CCRPublicKey: () => undefined,
        RCRPublicKey: () => undefined,
        authProviderConfigs: () => undefined,
      }),
    },
  },
);

let stateDefinition;

// @ts-ignore
if (typeof window !== 'undefined') {
  const authState = localStorage.getItem('authState');
  if (authState) {
    stateDefinition = JSON.parse(authState);
  }
}

let resolvedState: any;
if (stateDefinition) {
  const previousState = State.create(stateDefinition);

  // @ts-ignore
  resolvedState = authMachine.resolveState(previousState);
}

export const authService = (services: {}, context: AuthMachineContext) => {
  const mergedContext = {
    ...authMachine.context,
    ...initialContext,
    ...context,
  };

  return interpret(
    authMachine.withConfig(
      {
        services,
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
          forgeClaim: (_, event) => !!event.forgeId,
          hasHardware2FA: (ctx, event) => {
            const { data } = event;
            const HARDWARE = 1;
            // @ts-ignore
            if (data?.active2fa)
              // @ts-ignore
              return data?.active2fa?.find((item: any) => item?.twoFaTypeId === HARDWARE);
            return false;
          },
          // eslint-disable-next-line arrow-body-style
          isNewDevice: () => {
            // TODO removed until next-auth is out

            return false;
            // const { data } = event;
            // // @ts-ignore
            // if (data?.error?.includes('Invalid device')) {
            //   return true;
            // }
            // return false;
          },
          hasSoftware2FA: (_, event) => {
            const { data } = event;
            const SOFTWARE = 2;
            // @ts-ignore
            if (data?.active2fa)
              // @ts-ignore
              return data?.active2fa?.find((item: any) => item?.twoFaTypeId === SOFTWARE);
            return false;
          },
          isPasskeyEnabled: (ctx, _) => !!ctx.authProviderConfigs?.enablePasskeys,
          isPasswordEnabled: (ctx, _) => !!ctx.authProviderConfigs?.enablePasswords,
          isPasswordAndPasskeyEnabled: (ctx, _) =>
            !!ctx.authProviderConfigs?.enablePasswords && !!ctx.authProviderConfigs?.enablePasskeys,
          requireEmailVerification: (ctx, _) => {
            return !!ctx.authProviderConfigs?.requireEmailVerification;
          },

          requireUsername: (ctx, _) => {
            return !!ctx.authProviderConfigs?.requireUsername;
          },
        },
        actions: {
          updateAccessToken: assign({
            sessionUser: (ctx, event) => ({
              ...ctx.sessionUser!,
              accessToken: event.newAccessToken,
            }),
          }),
          setSessionId: assign({
            sessionId: (_, event) => event.data.sessionId,
          }),
          setSessionUser: assign({
            sessionUser: (_, event) => event.data,
          }),
          setupRegisterUser: assign({
            registerUser: (_, event) => event?.registerUser || undefined,
          }),
          clearContext: assign({
            salt: () => undefined,
            error: () => undefined,
            active2fa: () => undefined,
            registerUser: () => undefined,
            socialProviderRegisterUser: () => undefined,
            googleOtpCode: () => undefined,
            googleUser: () => undefined,
            sessionUser: () => undefined,
            forgeData: () => undefined,
            sessionId: () => undefined,
            CCRPublicKey: () => undefined,
            RCRPublicKey: () => undefined,
          }),
        },
      },
      mergedContext,
    ),
  )
    .onTransition((state) => {
      const shouldUpdate =
        state.changed &&
        (state.matches('inactive') ||
          state.matches('active.login.idle') ||
          state.matches('active.register.userCreated') ||
          state.matches('active.login.successfulLogin') ||
          state.matches('active.web3Connector.emailConfirmed') ||
          state.matches('active.forgotPassword.passwordSaved'));

      if (shouldUpdate && typeof window !== 'undefined') {
        localStorage.setItem('authState', JSON.stringify(state));
      }
    })
    .start(resolvedState);
};
