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
  googleOtpCode: undefined,
  googleUser: undefined,
  sessionUser: undefined,
  forgeData: undefined,
  CCRPublicKey: undefined,
  RCRPublicKey: undefined,
};

export const authMachine = createMachine(
  {
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-Eg5p6C5AoJ2bsNAADSVAJKQTjM3WCf1kzOlePoNc+ozABjsEuQatwLL6D0F3N0jxnQjEji-Ryb8P6JHnuQWhPJezZAABJAVAjeDgG9V7b3oepNqTMqReHeDqTwPh3gjHzDwncuhVyLiPsgkI1gxF4IkQQ4g0iF5kHbDGZeEEYx0JOAw1uCF2bpjdNYXoa53CBG9LqAwOhgjGE8H0fUeh-CtEcTNfBUi57uNyAOASuR2DMCoIwLejAuw9n7BQIc2i3bJiaCwgI7dgy6kCOYoY2l1AtBCJ8Vc8oCKhhwQXJxCRJEkDceyLkPJMhASUWU8hVDVI1MYQhIwegvC2BLAI4EjxtLehGHw7S3QiQ0hBBs9Jk9nFZJkV-Zeq85kVMHIwbADBFGsGqf4nR7sUyGBdPhSUt9SzkgIns4IzQBGPHlPqI+wJwiDKPBky5YzsmL1uWQh5VSnkvLeUcD5tSEJaElOMCYJgOi2BBOoPZoS8IpPsLqJU25zlXVGa45FNzN73L7I8559BXlDgMLi5Zml9TyjwrqUsntDJym4UMfozoARWBCJYX2U5BbjyRgbZl4ydBvwapxfkyBYCwBSs4GgoVP5-iyDQZR5TKHUJ8VBMBujECWH8N7cwpZupWD3NhN4sTOj4mOQINZehGUapcVqnVyA9UGqNWAE1ZqyAgVyMwChjqvmtCMOMfwBELLmG0MYClEMqTNCCF3E+ayj5H1DdRTVyLtX1Sjfqw1xrTVQE-jahZjB2AdkYDQAU-JWxcHebaQJQq3S6CPo8HppYEkCOwoEXQcNTHaSaJA6tmSkUyJ0NINtvYZCYCbbG6KFr0hWo5Z2uRaamFJPuJDT25JnRvCaNhbozR-A5h1JYEs2CbJDIRSM8Ndad3ED3VgQ9xrE3JtTUs0dANOgirlL4FJVJDDnwhq+h4NhdQdDpWkuFE8mWAa3cB0DB6Y0QY7Xa7tTA+38gHaQqgw7XaCrg8CTpCSXhvGIq8AYENJRXz0KCPcZjiSTnXYillW7oQ0DwI+MAYBP5IhYBwAcewOAFD5Okc91Cr34tBM0DoqFupUlvp0FUjosMtDWfUzouI0ziYA1che+cZNyYU2QE9Z7KM0N8dBGDu8hVjQBB8CY2h3iGUQUHN0I1i1-DsB4I+qrn7DPrU51KWBXPyfbfMqjPbaP0aHbpzS197grjuLiAiupgzzt8OMKcAQzDWKDQ51Lm7nN7SfB53YXmcs+Ydf58B9QtyxMwdpWl8NyTYW0H6SwG5u7+G6HKFrtat0dcfGQbzXa8v9sHYxorrHgjeBXK8AR8MeMXypC0P5NIT50iCI-X98KLmObGcy7AYAsASAgDQMAC8TzyDZXcm1lSmMtwCxAgRI3PYEXnDOyLWJFSxK7mzbS8NFTOmW+Gt7H3MBfZ+390UkGU37fqG0KBeYUnqjTC8PZZb+FygzVZDcIb8PqpreGuT6BPJgBSH5GgUb0AazWHVHWaqo4btcZz7nvPPz884ugOuDbvpCBJ4gNoXcATAlCZ7VCxg9mTi8Fh+pQQC3B0x1IqXhAed84FxnLOOgc7oBOo+M6YvxEvclx96XNv5eK8dvIZ2ArYOk-6OmQItx7GKlLLxoYhgDM6h8P0RL2lzdIt4hgQ9Z4nwQCJ9BoP4PScn2aK8EeYSTfejTJ01mtw1wnOQanll6f0CZ+z7nnFI6C9q5C9S-o2gOmWHMwgZnXTL4hGJIY2Fj2CNhqyU3lvj4c9sGwPyZeXBGCeM5N4i0Uy-P58G2rxUzQcylg6bKkYezCR4TpB0W4R8xUPaFn+57rXG98WbzGrPC-BLCVEn1vxHf98EAPhDBvYmhgRcwONC0hg7BeYqR4YkktAuhNAG945TY-J8gXEhd4p7Zkp0sn9CMpEHozYMCP4-cG4A8m498nUEA1w-BRpUxnRAh8IQgY9EBfBmhb45RtQIDPYH83cUtNUiD0DMDYphccDRdkt-0X9UCy4oASCSAyDld29mNg9EAu4fBvBugx8-Bgg2k2CNCUkC0Ulb5DEqQUChDPx5DP5RDsDtY8CnsCCxkLC5CXFFDG4Vd+UADqD1CxgaRgxuodC0MZUPUARyQ7BuojACIzDWdxcJMZDE4rCsCtZcD84HCZ8nCE5iDXDPpyDiBmp1AqCvk1wKQ8wklyVeg+4sRmZ9BRN3BupDBeDzDMjhCP47cDojonc85+CpDBDmjLDsicD-c8jKCvCvkc1mg8QSxJgRgpwoC1DtJNQjBSw1lb5-BjAUDYBUA8A8A4BYAvJUBOJEjqAmxERlFk0ikewSlWAqFd9Ri25b4Sx5UT5fBiQkl8JvQUkxgAgPhkEeYQsNiJAlYzxkA5N04fw-wAJe1exlMBxSgBtqDfBeg8JtxDCzNb8PjPYdAmhBMn0dw6QLIASgSQSwB05eQ6BGBFESEBxewSFikaY6Z4Svk7gNwAQYk1lFx6tvQuM4lESSxtxb8OhCT0BgTQTsY29GTkwbB+gWgcw9xgw4Z9QPiwkHhy00xehuhPZJ9H80j2dCC+ioA1ZcZyAbDkiJDcEejw1nDDSvswA3CKCVcJSEI7AQD3QNlekIUlT1kM1LAPBtxoip82cJd4izZrS8YkiRd7Dp9dSMi0DPxQzbScilCbQVDO8h9yRdBOpphv1KiEATARoBF-BZVYZJg+DJDn9ejYyDTsYjS2js4OjndXcyzHDXErTqybS7ThiHTCjkxETSt25txtIXgPAK8dQsStdmYSyQQf1tSoygzMAQSIARSSSxSyTikaBWAmx6AaTqBGB6TVdcz8TRokk-i1xZxvRBzNQC0SxVxu4LAUD5yF8lz04CZf8KToTcheQeV9zeTRodlyi0wj5vQdw-QJgy0PhQRQQQQtTujyzw0HzFziT04k1idHTNIu5zBRUjAJhj4pxpVnV4ZoF-B8IC0XUCSYj3dpDSAzwBxrcdjvwOAITAJYSBJ0gikYS4TuyEINwvZQQNwAjNS5ih9Lt2Z9RLBtxgK7zyKBDw0qKaLec6LEQqB2ABx2LvyzBOlgLBNghsQ9DEJILRp4YdwtAPgNxmspKLS9TKyayTSIzUjZy4jnCjSOzA87iuLPgvATdVxnRoccyhy4lQQUkpwu5PYpwmirKbTayHd6yuimz0iWz9SnLEz3D9zmdOlw87h2E6RUJ9d9QHg8QNxYFTCUC5NYAFMIAZZ5AvJCAXdciVZwzxDIzAy4iSqyqKriAqqarRQVZnKRiUzAD4ZlSqQtBiINxUw9kpUAQVxegM1gwxNzLYKpEMYuJ05FLlLVLUKAZTtpRo9Jxa9nj4dEIpR5VQR95kk3QUClrVYxSXyiZKZZJdzaZ9ymC-Qg1b5gQEk2grAQVPh9A79JQF1yR+gLq04xTkK89XLNJzAzAsTiRbAIVRrWDEJuoupQs1kRgQwWcAzYiPdgzioQb1YbKGq7KmqcbnCbZa4kr7Tvy6QRpPhAVMJjlB9twGkb86QIK9wAgwrZDyb1Y1sorc4XdibsbpCyb8aequyIbNq0wRoj57AtBLAuE8LEJqjBMJg6ig1bNSzzSFqxkWriByqnpSprLNZbKYLmydA9aDb-JnpErBjciXK+rqDsxdBHg-YfA74aceFD46sqQ7tByV0ubE5FEzxcglh6q7ChaKKKzZDg7Q6sBxaUqVwQLcxggklQ93AgLoapS9x6ttJVlA6zZY6w7CaI6za4rcbPwi747KbOzlCwdAC6Uxgdw7gQRljV1M77hs6CIehARMaZySaRb9Sq7MBIrHcGzI7pLLKY6Q6lgE6Nr6h2CUFNwn0JgSxBKPgvBgR0yiLmbPYUCvIPtYQoAmwnwYABxGoCaTaiay7ozXED70Aj6T7Hwz6L657OKhUAxfrPhLFD9YYPiQgYbwLv1Aq3h97D7Vhj7T6wBz70BebM52iBbGztbzb77H6oGYHkA37Jahs+KARegBFpjcw51BopTQicTug2bSxkD5rzbnDOQJB34F5EiS6Uib6gy6GGGoAmGBj64lD575iVwHgOgBEhy1x3hKU1lvY5QjFPAdxcwC6-J6HGGwBEi+ax6YrkHy6OHlGrCsHHaxi3hB417Ft6QvqvaiR9BbgeMFwj4tb8Dy6oBOHuHWiWGzT7Hb6dBHGdGeGldkr+GaC-TxhgxSV309QL9LsiGEkT4n1fUUCvGuGVGRCr7S7YqPH4nnGFCa7mpkz67vDFUukdQGjQQgisRJRpRT5PAUTd7qGsao7w10nEnWi1HorBa2G4iGndGsnercmxj7s4lfZX15tHgQViR9AxL3AbAgQkliqvcrcZdzY5M8ZiBZAo0KBmAKBw7WHUmgzLdrdy5FmFMVnOI1mKA9Gem6knhRpj9Vag0yU9k9wrEZjDA2ZEMZmuc5mZYDnlnCBVn1nR6WmkH3GdnZm9mFnIBDmfnjn1mzmAlUywkKRKc06RGcM9lBNOkg1kdPh9IsKNizVPnwXvnfmNnPNrVet7V-99G6kObRoFtnRzAcx+gX0KROhSx+klVSVcW218WlmjmTnxT36AZ3rmgmhMFUJsQEl7mcwVTCmSxocQg+62mcbgNuWIWiW28cnYXACb0PL4NJx-Aj5b49kzAwVOhonHg5agaaHy7lX9mCXeW-nNtqNe0dsGNQdNXvDJgwU6RV1PXtxEbbhtwaXyR8quNpzFXB7KyKAwAwpYB0ACp+RUBLwQo8AKE41mAvmjnNm3GdT2H9So2Y243HwE2k3CAU202M3IWYXPkqWkS+ps13g6QtBjINQiQByRGKxHgFHPx83CBY343E3k3U3nB027XIWs3Grhbo7E4e2+2i2B3S2h2R2eXK2umVcNXq2gkElYkcNIVpblVjIdI9RS12XXg7Gc2HK83o3e3C3i3B3y3R2o1x2J6LKYzZCZ2b352y3h2K2o0E7PDKXN2FjYbnhnmdxdLU77gvVXQg0C0u2oB33+2S2v2l3VXOIn3w2p2zYEO52kPF2f3OIE6CjsG1CYOs03QnhdQwlBLIYvBljWZiRDKktNGPHnDsPb2F373l3H3mnEHn2db4rI2r3Z32PkP8Oq28VNJQl7h+ltIiQkk9WX1uh+m-T+Ttw-Az37LSbL2C3EO73v2H20OePOjWntmL3BOdOcO9OUPCWCPV2673X00vVNdFQGsabPaZV-CsTmS4CTqOgNOB65MLPxlzRXloTAFsAaAnk3kCh9yiRDselkcdxpHB81Q3r+nFQVUrBiQU8rXqJAvr2Cpgu6A1q-5T16AKBcgcgOBJJpJZJ9yyVfCKiixBEwDlxiK4lWhBzJhPiWt8vZ3gvcl8lClilSlgdBxYv3AMzmYrBUJw9Eabhup2MTAPAYVEt8JeuhPC3gu5EZkeUVEwJ15N4tEBWmZfAxhnnghAUaQQtadcIYF1PJwpQu4NugvWUkQf5SuAFhJgFhJ6vmkHhx09Q2aa9lwC1Dd7BHveErBLXamUs+utvWUN9vFL1-HT40rAhDBdx5P5uVw6CNkBEsFg53gXuCvnxC3WJYBsAvtH3mBoxyTwvIvsBov8h6vPgRp8Jgw2hZVg3Qe+FTGCIIighObcup54fCvSr9a8bSp0PTOEgxfnwJerbuq7PUfwssSRFc0c1GXBobgpjRp5QpynQcISf+vFepeuJ-nePw35ft1WrDauJxOWNSc06UJkMaVcQce1lpQ79LFotMfJLYepCbfLqBIo055cjv9CYJI7qWf-HV631TF6QA3dKbgXP-RgwU6dQQsA-+7hbg-npQ+QoIAI+waJuXgYbrFgxfUAg2uMK0wQRPAcIC0IQRfHJ8-SpC-w-CdVqVK2BYTYu7BF14Zbh1dcwVxlwUlpO0wgrAh1KTetvRbpfXGJ2KKbfF+HeVeTvEBc0xhZvcLJ-Zhlwq+ZQfBARfUPB5-Cv1+0Pl++Oro1-9Tle7akyt+EBD8-R9Eu41w3QFbQeg0WgEuvsBJLMBz7W9NuV-R-s9Bl7MdRe4A0uInCf68Nkq-7c5ghACBIkrAayLuN1zCQHUbg9ITDNxWvg5oTAl-eAWbDqpGdx6YAoLtf0d6qE3+wcS8rqG8pzY8BveWjoJm0A-Eb4oDVvnLzgEvg5MjUMAPPkXysBl8q+YpJ93K6Vd0gHAJ6rZk1yPATIxFN0MuDT7kc3ggVU-gyn4EW1BBsmMACILEG54rijAdIAOGXhPVQQ6YMsIZk8CGUCwK3WJN3Xwg14FaZAoQcYLjamDS+cfVCLoEwgmA6QPgMRhPz3BxIdku1RVKhi8GvhWIh0D7H5HfaPgI+t-GgaTxfASBEhC8WQN2025pDRQ9A1Mpwm8CdwkMoQj4BoJsBHZc0nwN4KfniE5Ckh+Q+DoUIj5UCNGQLNvoYJaF5CUhHQ4oZv2I65kpwI0XoAWi+AJI-SR-EOBARXALgMqDifQTb1QClVHwI7EQTnmOKnFGA5xWgJFy3g3FvyIwCYXSji5ZV-AR-FtiYGEyw1TsXgy2oMILZFCLgdVDIbLwMFBdnhBQ14bVWeglCtWa4MYG6FXA7IggtwDQbqH9AssHi5gdwCsMD7P4beHTJJmIRSYwDehQXNEaQRGEAdIat8XfrwSMDdQoaKXMxOxjk5JISUpmJjj0IEE4inGjTQhJ8KxGMishuIzJs-2SrrsJOAMCYN1CPJc9WgM4MwKDzuAGV-qq4Pft0C8FcjP4XQkzuyO+GcjmRnTHkVTVR5mYABk-GGIiUDi-A0wzQHUNslMT9ApyTwkFvM2YB-M2RDI1Uf112Y2joW+I1AZDS8p4RWgr1KPMEwLDH5NCPGe+JOHsBWj3moLW0RsyVGAtz2HIp0daJliujNRtdOPtDm8C+0NwYIVcHrh15s84kPGSnC8AaHrFVhggyNJxEjGtpzU3WUlj2E7QyDfu-jZGp0jO6dQ2ecBFLq0BbGYRGss4PpP5zz5liG0FY9ZlWI2xksnW+WXbG6w3bFYsWXol4OYC7FWMCwHwdjCCBpDkhIYwvZEffyHG6pKxCafwa-2bGhE7APSSjgPmcE6QHiC4VcLcydBeDyxJzMcSS20wSQPyX5Jsd+hpZFjYabQLBM4IIhRCymg-DhH0ifHDiXxR4qDOYMsHWCmxxTM8W2MvF2A2uTdC8XSD7GPjSxQXZ8aOITSOttsdGacfuVPGtiLx7wK8bmPuDjCQs94wyP6Vz6r9BBwJc4J+Cfp8sAEJCNFLaj-y3ECRAMZGgJllIQE3gzobCOUwSxA8c6NgekbGMdFbczen4ETtZ0zb2iFJNvZSVAFUlic3RDnZMKdhGhfpjy4+MJjrzRxedv04SGmsCC8HaTdJBnS3sZxjGadFJ4vO3jpM-ZqSV2yYh2u6IFGfAOCIQHXJ9X9QFhTseEGbqhmQyjxdxBsG3vL3eyfZvsv2XKBcEBy8SQc+5WTiNjCQPpJggIDQQIm8BgUsEsCKtLhKyFJScceONKf9kUzEJSE743+FQH-iAIcp5gD-n4HcqZjTsy4KFJSA1JTCXgZ8K0RZ2Sm45UpBODKceNGGCikcII7yitzpADSoYgmYkI8CEzaCwx3ubtnaOSZbMVRiUhMftNOb6TZxUtWoT4D1bUgTIEUy7GKO1BThTK8ktySdPDHzM+W0Yu-glMEHOiUhSYpAVqNf53ByQlIXgZKDzqCVVAR1YMO8F7EPimJmQ03p5LjoHpvJ+HaAQ6K0loylgjkrjrZz8ndMDJTpGYg8GRzBgHmXvHHmsTwiEQeptgh+PZLxlgZMZTkn6SjKUmsyMZSHHyb+wun8iF65MwEKhFQibIqQy4TaVEN7yBAAg3QSUC1mdyON38hqT-BACK5KVe+byDiqMOsyaEOgA1AINCk0DOC-OQjFcPAm0CkoFWXw5WRIFVmwB1ZwXRSllPG6o9HiBEO4AM1don4JRugerOpzRweAkRzElLPbMdnOztJxtDEUdIdERyxBtvSXuXHbKCynepTF0vlNXB2Ak6KfAkP5X4zHYaU0FO2afQdmJzo5EVTmaXOfrlyP82eJOVbVtrAyUxr-EKliVRzGyT4RhJWql1HIRF9w1Ob4iXJVEJz65C+HQFRVMHgl-wgEMblUieqBAeSQaE+HfDvgp8Zim9HUHdhA5nclZZcyOQ3NgDIB5mpgjSW5LHlqyj5J8vyGIKBHUE1OXUaJlshEQEoj+U4fptvPwhzgNwoc8NpfKdnXzT548nPNXNHkHyK5N8lSSAvvlMlgw3gMVgazk6gUJ+5fMkVOXqwJIw2XwzVDazBaEy+WREmjC60Kx8j05ATHijAnxAmRS0eyUCkSmDZ5hCpG4SCQeIIltpxxdY3LMQpImut7Ol0iUAuBqI6hCp4qL0Dr2-4AhRK98RoaFgiBkRiANpeABUG6KjCNAaCtoGsk6AmRWY83KGVfCS6m4eo51eakkFFhqKxWYzA3LN0mE18de5KF6lYDMCJJyUuoBzKMNXRjlvZ1s9UsSGcFGUjs7MNWqBVtkqiUYEsR8KMIHLCtcQqdP4CUxTC2DNQG9afjNwZD6DwlscO6K+CyV+QolAvIRvfB7gBxuYpYUOPzBHhvSB6mS42CxGeg8Q38+SpJIUqIb+wuYEMN4vrzDgIwMl4sLJZLErIqxyom0KqEMACl6JmlbMVpWDGwiKhym+ouGD0vilFwZ4d0S6vGSaWdIploMXuIaJTBphaOCygWC1hqUlwK6ScS2FXB5qbKWlOykpRDDCHlLh4SysOVIVOVxxLq9EDqqxEgA3LtlxS9pUMC0ABAulFSl5eG3eV3RkUTS6UGzxwF6gNaU2eBVoADDiSTMVgBvKMMhi01jsXGM7F3Cmyb0k6rxcAmEkMAoFoVgkiUOriOycZTspaf1ikk3q2Ag5u1QRBSq3TljwMcaKsaMMJAeVtI-QMwJzx1CzKPgNLIwJxjlBBoamry-jlqhIz7puVYy0mcVj6gPATq4IQUVmCNbl9W6RYZbg3w5XOZpMRghTFivxA1FEMtgQwL7AOoe0aWxmOSSYkmDGqEga2C1UKN9QvSHmPQJWhMyrxJJFxBacENgpVGapscKU-HOlLagCK1cOEMco0n0SDkmaMMcoVZGPJmQ5R+gzVADNlwC4PFDQ0aCSvwiycC0+uTNLNmy7Og2g2oClXPhAUeK0aoqMJJ0G3khUK8koz1qZkH5bjQlDozDi0RICjCYUfoewIiVnBUzXgFeR4iYD5LjEfANgDYlsR2KGp9ihxFxFEtWLlMK0RhcwN+hHL5kSyanTcELyFJPlsYowroPcEEzIIJmfgEwLTkExeds5EPUsK8FlUYdLS+pDZVSrYLgUeSe4AfD8U9gfEPAY5JVOoQZwjyB1cFBcheuQB6yfkv1WflKmaSI1gK4wR7hnzCJEhQBOCmSmAGoq0UwAV6+Ag8Gh5LjKRulA1aKjHx94-A2gAcXUynqJwjSow7DNKAF7wIheKSQShxjHIsDCQaOMyssuBaVz2q1VdiF1WegcaNadWb-g1jonjUNcVIYOIWVBSghgaNcRDX+oPKTgaWmPcLLQRzEypgVia32uARzBuKc136wZfjSvUQEjybGLPjML2VqdF0hmIvO4N4QzNtJKsdjXpsMhpUc6tgaWqyyfUmtdqW0nwvhvDV2bp66Mq9WEmLxnYxUGPYEEBUkbZ0uMxIHcCWLE1xFUGEDJ+i-VgZ8rgmUjfpH61lZcl4uXwfLSYlsBwclGCTKwh4qF48khVta0IcQxlQ-8sNieH0rNwIhxN1Rm6vTWnXTA5gvex+BJBZHGqPFFhJYJviyr-kEaLcp0-BahxOYeKM0dWDWt0i3GCUa8QQlpL6VPJy1OWxAFVjZ122TbaQ+vZ0tiBBGmaPYtbGJOOmEQM44ObHT9nhwM4eLceHclgb4H+SeApsFjZmM9K-RmAyBWK5bnVmzBpgdCPgZwbDFFR+t4CD65jXD0EGUrxlJHN4PwkSxzrJ+qC6cKvM9g0g86n6r4Tb3J6U9qenEEddMX16Thpi4KZ9PYvEpEovKt8POpVMK1xjuZyc62qVA8WdL+gUwF4GFneI68k8Y6zrnJMVT6svBIfMPsX3BxxqaCMBRNQqDuFk4cekzfhA22jy5gwiXg6-vNM+reBZ+cXWRabIV1aVJqkw2xFoCDRxacZhg4Qb4MbVBbbm0CFeZOFnRvAah0nR4GuEOSijggzQ3IckL+HXs3hsaoWYgAEQpJ1e5YBAp1GN2KgsSke-dVuCrBeD1hBULYXGwgCObb4l5aJu4GyoK7FQoIqYvqCJBQpb4Vo7SakIBES7JtZTfhGtt9QKyJ+tQ8WfUgRGdAbNwu9yc+AVEjrmCBlIDXDGsl-9fCcnIMXhoK1yq9xPwrbZGPmmwJRowq+kHUXPw68cwWykRhzW0i9Aqlg4vCcOMPFtoLVjxCyMjtb2oQU+XYqRQjKwlIzcdQffcUS15V6bdWSOrHqjrzmghKQJKMLbLR5heC2JbQzies2f2LptBsnCAw9M1z+FtFhgDWl7s0mCCHJ7MwmXrKhnBZb1pKtngWHhjncycA+GbfFnGmk9JpdUmaSnvIWH5QRkoH1StwpFf98x9iYflCkn1b6-pO+z6YDIoB6z2EWaGblVjpbzdV6WJQELwUsD6Z1tx0ogzzIJmocr1Qq8YCoK3DDVJZCuy7umKiJdxTsF-fQQAvVmFrXBjQn2b4rwHqgRsp7ZuoiS0D7za5h8ieQTtVWCsl5JZIKiywYJmzDslTEig1gfQ+GVZFczyYFsJ16USpJZT3Z3Hdq9ysyNRfjLP2saaH45ECkBdkLxg-ZlmUS2cHVjWJUdgKk4CI2CgeJQV5wcwOI3XKvkTyp5-u5I70C+Ialkc1mc-e-NiS+AxUveGVS8FaN+GNZx84Be0cr16bpsxeIVQWh1C5ggNQx0IqMYGZe9b9FFOww3LEAgL+caQeY8kdDwy1m6JKXoB+hhkzFfkWfUScXvkVAA */
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
                  localPasskeySign: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',
                      BACK: '#authMachine.active.login.idle.error',
                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },
                  signWithPasskey: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.verifyingRegisterPublicKeyCredential',

                      BACK: '#authMachine.active.login.idle.error',

                      PASSKEY_NOT_SUPPORTED: {
                        target: '#authMachine.active.login.idle.authScreen',
                        actions: assign({
                          error: (_, event) => event.payload.error,
                        }),
                      },
                    },
                  },
                  authScreen: {
                    on: {
                      SET_CONDITIONAL_UI_PASSKEY: {
                        target: '#authMachine.active.login.idle.localPasskeySign',
                      },

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
                        registerUser: (_, event) => event.data?.registerUser,
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
                      error: () => undefined,
                    }),
                  },
                  BACK: {
                    target: 'emailValidation',
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
