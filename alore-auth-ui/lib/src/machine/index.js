var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { State, assign, createMachine, interpret } from 'xstate';
const initialContext = {
    salt: undefined,
    error: undefined,
    active2fa: undefined,
    registerUser: undefined,
    googleOtpCode: undefined,
    googleUser: undefined,
    sessionUser: undefined,
    forgeData: undefined,
};
export const authMachine = createMachine({
    // #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBGACwA2bQDoArACYjAZgDsRgQA5tp6+YA0IAJ6JTR9XtPGAnL6NrdT9tIwBfMOc0LFwCEjA9EnxZADdyAEl2dPp0gEEAGXSALSpBESQQSWlZeUUVBA0BbS91a19TdW0DAU1fcw9nNwQDXT1W8wFTAItA+wiojBx8IlJE4mTCNLJM7LzCkr51cvEpGTkFCvrVX3VzPXNzXwEn8xH2o0HETX69Iz6PARafoTXwGeYgaJLOKrDZbah0fjCRRVM61S5qdRNTS-EE3HSaaymGyfBrqeyGIyaQGaVoeayU8KRCGLWIrBKw8g0dIAcXYjAAqgAFMrI041C6geqWbFPHoBHrBYwfVxqR56LrmKndUGYymmcGQ1nxPQcsj5VjczIiioo8V1dy+bFUwJtAzGczaTSUkmaAx6TQeP7WAxaawOWwGlnLY2mgBirAo3NYTEFuRoNAA6gmACLWk7Vc724ZkvSg0xEtraIK3Xwk1Q+f0GTS9QJdIzaR3aSMxaMwvCpBIAdzAACNTMx5KR+xIAE56PCTsD9khQMhsdix9IUbCMDNUABCpkY5st7DzlTFhfRCD+ll+tnUJj+7W0mpJ9NMv3U4wDj6pQW7KE2RNZc0j0YcxwnYgp3QWc9DAABbZBCAAG3SYgxAwMgADUqAodJYwATUYKhsFydJ8hIwpLX3CjskI89bSvSVED+V972aJ9-FMV9NBJB4-U8H8OkpGx1EAo0+wHcDR3HRdpznNIZ0IAAzFwVyoJDUKoFDCCgQgR1QmQXDICB5ASEgUgkABrdko2hdlQKHWSoJguClNU9TiCgTTkJQnS9IMoz0BcBBLIkPBkHFMpGMvNEWIQCsnQMR4+mfHi3xVBB2k-cxvwcX9RIAplDV7RzpIguToKXWDFLAZS1I0rT-N0-TDN0kKyHqmc4LEFCopU2cEJNezgI5GTIPk2q9A8xrvN87TWqCjrQvCyLouEWKC3i5R3BsZLUssbjeJJbiv2Ev8BEeCSypAiqXKmuDEL8owVOQCcIHIXD8KIlh8nIncNyYUjyMooxY1yLbUQlXab18No9CCYETGOzKhkxYx7nyzURKpa6StGmMnImqq3LqhqvKgZh+sIBD2BU9AFpQ17kFM8y1is2yRp7By7s2ZzJuqhSZvqzyV2p5C6YZpmWbC4grPW84YqRG04ph+oOkBRHAU1I6XzRxBv2Cc6Ctxq7fBu3nxsq1yavc0W5qpmmpcZ5qWa6mcernPqBqG7mgKJ+7BbJkWKfF536ddl63rlhWoqVzaVfzaGi01rxrB1750pOrLv01LGLtE-GFh5sbiZtx650ICAUM5Kh8ioZgmHXdhG-oBMobta92z6QxXmCIkbkmdR33Y3xQimSZdHbNpLbL6SUIkfTiDIBEhUYahLRoLgKAFOgKE75jYame43lsZ9XipHoSTMLQxk1JssQfwk58D-m9EX5fEhr8hW94Q+doay9BSAwUx+jBkxJYG+Ew7iPGeJWAwARx6aFflJd+n8SDf1rmaC0mRdzZAABK7gPOODgrcm4dyTheba6tDbj39ASIwbpbgdEJAYEkNZPwOCJMEZogI-yoPKugpemDq7YKTBaBux5cFnioUxQBrF2L2AcOPJoECbg3wfOdHwzQ7AehSoIvmYEMHECweQXI2ZsK5HYMwKgjB26MFTOmLMFBcxyLVkWGkdwbg3D8D0AQfwb4pSMN4JookLBhlAYY8aJi9AzjAOgZSYAUgrhoMgFC6A2arHClzUqVtiaxPiYkwgyTUnpPQLHCK8d5DK2ONQlO14Hi+G8L0TUzZ2iPGCDfJ4zSLC3HbHYII5YuwE1Lm-YxIjTFFKSSk7yaSMkey9noH26BBozmGnk+ewiv7TJKbMqA8yKlrWqcQWpooaFFnrPoSwwR+gdg9D0Zo3TjaeCbOPMBAZJjRIKZMtYmF0CCmQLAWAg5ZwQDIPuXIzAADSADaEIAJNc6wAZx7NH+ICG+dgBClgCXlPKr4bAOG+QvX5JB-mAuBaCmc4K2DYEFA3LgjAJHcikVyXkjArTuIudeNodx2wovaAEQIrQSSsP0KELOKiBABJ0MS7ZoiMIYApSCsFOE8IEWIieTldT5HwsfAIQSYZzCElMDoRUyohhGDxXoZ4jppisM1HKiZX9ZqU3yJMrJFl5Y2TsmMtBzrMGupXO65elTFY1MTjqjx15aR+l0HimwE8+h8Syvyv0V0QSvCtZMAxoyA7+oSLEoN3kQ0kE9RzH1-tJJCIDaY4tUBS3EDDScmKRxzkNISrSLwboBnfmeKa8s0CT6PF6BnXF3R6ROsLb8+tjby05N9fmmt06XUOzdZM5tG0hB8CMFG7lnbCTduMLoPt7QAymE0c2RGKUCTSqtROxkJcl1GJXYGtdwaPVmWyd63JhMC0fxne+ktG7jlbr4KYPdHbYatCvYEVsHQyQY1Ffw+4ui-hEn6DoqdAHV1h2A8vRZvV+qrL9ps8Zr661AYbSB714bTmRvbV3BKjw7ieitR0XobozU3xpNinohIM26huPqPN1aX04cwbACQDNBzIHie7dcm5tyMEzCwVg2ZShcqg-UL0joxgGAzhMHiNIaSYpMIYAJuhmwWH7th2JUmZNybAO7fkdBGAENyK4jMnm7Hg0hlppjx8Ah3CbJ0XFryCQXtTTSfQwzKR5VYT4OzvyHPoFk-Jt6EKoWwoC0feo-LrA2qujWZsVrQRBIcGMYTAQ+HtDdMl3DYtvIsw+uQL9XrOaLrEzEwDeGoAtYkJ9TdCdt25YUcMGVvxPCTAzvSN4QTQHeFvkZuk6gLaiduj1xrjsBufXnT+rrm2fnbcprtsAw2I3brbarfdsNugeC-JrfovRTWYqeIjAIoDeiTA6Q1t9fWzuEe9sRtZGy-3Lok5RgHb1WsXfo6NyDgWdNBlQ5SZsHpmjIugdKizGdRI9AsM2P7pjMByYgOl5zmXXN2JoKwWM9BvPUEYH5uFqcAiFfuUjUBpqnCptAV4A1vRvigmMB4YnehSfUop+7b6Gr3MZkYLkfk9ACGs+vLp8V2hnghmbG6YwN9PCa+-DSHpWgRlPu68dzBkvydOfdpCmFavO2PH0GYEEVhpVNjygbv4hhEHtjW+WNoPRxekEHNmUpeByCKa3DuDT2F0i2LUxpp3d2JghOeF0XQnpE3WGgUEbwrQDXsaeI+5kfqIexLDxHlJUfKC0CoOwbMyfNOI7y4gEM9CAnSvLPYY1XpunljGCijOWh-CgnF-W1r+3OtVqOySk74tBvndAyN1P9RQiUn9JqQI3QDNUhTZaj0n52xfd3wZ+5k+qPT+6kR326y5-5IX-9prVNl9w7OTd7THeJheF16EOwJBHQTRK1f0J8dsJhZFcXeJWAMAYgCAJfYgFSQgdZE5JmGfStMjf9QpOAOAhA7yKCZA1A8UJmD-BjL-JHDvHoO4QEHwG4b8PpdhVNfwPjGkB8bvQMFBDbJ-eVUxZ6VCd2eERvZvNgFPMbeFewTwdUF7WwB4QXPPLKOkbFF8YwBgsrX0cXfg5mTLWXX6EGCiZnCGdfL4GwWBLQAzKYG4TUBQoYDjbFZFN0DoY1aVXQTQt2TLB3HLNvcbCA5pA1MSK1dsPvUVYIbFGkFKY1LtPKK-PrGWTLdrCtX9CvcTItKjOI5AMghHRjdvBFdobFOwc9RhKwbQEI0YeNB4LXHpQEGI1-dIoHZZEHUjcHFI3rWo9wjI1fS7YwhFZ4bFJsYoykDUK6ZDb8VDTodDK6csEYaA3A+ApqPyafBIhdR-LZWtOJWY-AnyZqWHTo+HboywkJDOZoTEJ4U1EYUVJhZpXED0WwUvMvLAyvVox2AhQcXIRYDApI59LbF-Z414xYTI7o-owrbNEYQAykLHVNN3dUZNYwWwKsIIc3cvL4q3KHV-F4t4rAD4w7HgtY+tdE-43Y1tbw+FLXLWAJNbEMfaPGA3CwaEh+VseEzoGo34jEzAeolZUHFY8jSHUONEv4rAAE8QzxK1O4NoGeYMCwHiEo1NcsEJFKFKTELoMkSdbg1YijPQFSBJaEKAWMWcGAbMKKVmJYg7Lk7A35TU9AbU3UmcfUw0wU4ky5cYnELoY9bofaKsIJfwf0LXfEF0AkcXC0q0vUsAA09AVmW-YHe-MHZI740xQMlYHU4M0Mjo2jFtcg5OSg0kK6UsQIXjQkJ4NoMMIJXoCkJBEE8fZkymbkCQJeWuOdY02fB4loxfbyas2ssARte07I8bVoEMU+EESYSzCwUVESOkpoY4rQK1SslcNsqAOsj1CMhoqM00x4lsqAWc+c0NQk9M+pTM10e8V4OErXFKYcxQ1ha9ZoKYKkeGWYcXKAGsucjsz9dmZYps2MvQe89szs7crIignIswQSPRflLxRBUIEIn4J4eE-tJoHiO8h8zcstBszA5o98z8x8781MsDa7DMnI0kwwQkE3U-ekb4cCz8F4LEGecYe4lClEj8+Cp8gjRcjkpomM2itChCptH87o+sZpAkNbW4CYfoqsXQZDWkx0S+eLRBekREt84meJfSWAdAeqMxVeAhVgBXHebAGgRgbAdTAobowPTXekHoboVsQJLKVQF0RGbPQEcMQY7DeSwgRS5SsROuJvDeKgLeegCgXIHIDgEiMiCiAyzULwLFGC1oKsPfDhSrRUDKHiHoPGawBysABSpSquH+MgCxKxGxOxBxJxTMHMbozwKkFpT7DsXoW4aUoYAMfQfi-oAJEYTpdbC3efd+Ry5y9K7BLVPkDMQhYhQ8FuNuShB07uYvHM4S0dEYJoXndGakMAjpSkt0K6ZK1KlyjKteQUDyryvCPePCYKvsjOf4JhaVL0Q-DEUEDifwCop4Z0MEVU7k9qtKlS5lKRbqoqzPBhcBMSV8BgusToGg8S6VLQLOTHFapyp6tKhCWAbAQbdJNcc0NzTS7S3S7MfSoUmNIeL8CYO9ZFL0J5CylGQwcSsMV0Fwg1MGjqvQWAuY+aZqLElc8TR65S6mzY0gri9GhKAZT8HQGC7Neq84s82Lb4CBToX0UEJK+6-9JmucFm+Y1Cdkxoh-WS6SaWqmvAuWlCLsv8ns6ze4VRT3SYHhGaw2fQb7SKlg-tNbCWlqnEhIVWrQ7CdJauE5NVH6YifQ-IIq8WwvMwekOE8sY2hAV4G1Rwg1NjK6X0ETG2tU9Y1aucB2p2iAF2zwoqqwdNY1EwUMWQs6hAfpQwewEy1oVoekVoCmp6hO3SJO8UevOgdy0Q1vbs+FK1QkbwEYekY1ZFBqwO1QPjEXdDIIQ643PoMu5S+tdApCz4y3FWlK8G0etI5qLWnC8bRg0sZFHRPRQnfiP-Z7asK1L0YZEe8mNovyBW5c5Wtqmeymsehe9mkahKDodiXQc+PKKwc+A3P0DofwHXUIQEbocwQ++ceJKKMAZVKlGlVgOlBlOxTedIbeHyvy2RO+2GE3bEYwXFKYWwHnEkDsUsZ7OBYXKYYwABvAIBpS0B1VTw+xVgDlbMBufY2wbFCJD8f4MMPoOsfOeEtg1KQEK6GSmi6euOwBsAYB8h6lLLR3Dm4+KwT8AnX0QEC+HO1Qb4RGU-CqphZhb8YhiQBCPqBJFcCgS+xJF2ie7EmO1WhcHR2uWQbyAx1KmcE5Re3cnI74PsuwDwcsJ4MkAWoYPKbfU1WwORskB4KOpEqei+wRix3R6xqAWx8G+x6upixW6M5EgR2eucSJqx-Rwx+J84Rx3VTxN0+8DOMWkwULP60YlRLQHwKSskKcyWiHVWmA9Wmx7JtAumkxhm8aRpjYrJuxtpvyPJ6NTmvim1MMToeGLxh4UVZpTwSwEYToMfYMf++pxmwx5S9ihixCl8k08+sCVWjZjCuOMDSR-LR0ZQ3oeGAnZwwdCyoEQwH0lhgEUWgBg55879Rs-h8JtJuir8mjI5tfbCpxnwx0EJSwYZE9WUHiOsMwZpDsBkESQPaolZrptZucV5xiz2O-EjJWz5vZ1Fn59Cv5qpY5pB-LD3G1XQHWLoTsdocp4Eg1BZnvDsVFbDNZe8gFIFFValFS2ukQ9TBu7W+FMF0soISYZ8TEGwxAY-D7I4geCeGkVlvUiQDlylMFFSoQlMNMAq1xQEksxNfpcMb8OwU6ToMAqYUIB5YG5Z6O7ktl5V0RiANWmmt-PbDp3ZhIO1lVrlx12Wgg9-W+xuosR8DOe4TUZoYJsBKFrKaVwzffPKQskJ91jUpVr1sBp1zYm-TFyM7F5JsJsCT1h19NpfIbANwVosYim1Fh8ePoMsC1RAdu+4K6Sk41J+2VZF4mAtzltNsPB1tcDgJTHcfKlxNxUlqV2wHFT7F+0IDOKLWahsORoMHQDUa20J1q-NlNwt2AZAfZXtt13Fj1jdrttVrdndo96lQZ27eoRDbxHPZNfhHQSV3OgJQrS+Yef6-la11d225Nm0+1s9n17dlcXtxJs+-dn99lzdwD7yB1i97-IOgIP3B4E4x8FKfG2avTIzTpA1R0AMCWpkYgZfeACoB4wN68DQHXCkN3V+wZbuiYfQA1Q6qsORl3QxJIJyUjhKDQcYOkoIJheqgkHO01bEc2UkyCmLVw9tgcDj2GSyu8I2YqnwNhJoJgoYVQTHe4Hwf68kgArgm1-9CuIWWqaT-LT0ZpeUgeZ4TEDobB0IdUZofo3mqsRNsDgzkOBcQzlcYz1icBHEOUPWDKHO8ePlbGQqPGZqr9mO1zu2eO5qdCf5Lzm8Hz7NVpbOA2XOzELwPKQuML7DKL4Wa+vyAKNqYKIYJepupLiYFL1GHOx8HiE2HGS6YuCL7kvL6aLQs7BL9jYEyrtKarjhLxAuU2Rr8LpN1r+2PrCWWmSOdIzrirvz1Lmrnter0L82XLh6Qzp6bY+QIghCSAWb8kZL3r-WGrzDQbhrouEblz9bkOVy2b30fTDwOQ0XE6-iEs+GUrM4x4AdYnBLyyrfeTqpiw7oLoG+K6QrEYb4fhKsSwF+ST3gsxBLi6rUL0XGsMB+2d7z24Stu1MwB1InOHtY3ZUpOZcpBLr3dUQSkwEdE4x9wIL08qp+t4A-T9pN2JMlJVf9xH2DewUEILmzIs1Na1W1UIeGbG7Pac-DEgBLxZsAmF+zr7KqxRAvZFceV5LofxZz1i5-UxWAVAPAKPYFFSVAFCRtBLz0O8Q3EwATqeQOnuF9xBeUfjAMFnsD+zaTNLO3N6BL811Bou9sMNo46BUA0ESrxKjgiX-rGHZfBLrOEJd4D0G8z0ZsIJWz7UHQS4sfL5An9Um3aXL3st68c1kJAMcA4wUBRBA3U1k9XoqwNbag0PMAcPSPMAMnvORGIkIXQh0fS9DnAkAspoKeNtvT1cn4ymVrMn0EDPPoKsP4KecrQXrXQwAeA-AzPEPhrX+Hpp51wglApCEg5qMnokQScfB4BwWYW3-wU2sZ4H2rx0TXlJ+H9r-Psr1OMMbEfvCIwnYilT9wLQew30KkGSBrZaAI+M3AvglECbQlQQBKdsE2xCI0g7O-eSkKFmiLZ8eSW-Vmlt0+je8166oWYMZi1wAFRUgAlRpMRsAzBSmEffElgBj4dh9A7wadoqDyg-8bwngEJPcnxDA9z09-PNuqXjIrhrStpMMr90qpjBvwCnIHspx4yPhSwpnDuppzurD9myo-GcvRVN7gDoMVTCkEag8CIIbAKUC4gXmsL3IAKNwOCr82Xhk8r0Q8W4BFQ7qOhRKfoL0J0DxwPAHkig5rlLVRbS9CGetUkv4XLA6w6w-Of0I+F3wAFVEPAtdnbXxa3cNBV7PoGERcaitjUHoburZ11ylNR0J-V4AA0hrQ1YaKEaXmWEba+J6qLpZ4HWDAQ4hxK9gH0lWCZJoDVavrLYn5Gl7o4VGQeMwM4K1yPtQi6oRwgEFuDNhO66-B-ni0EYV1nagWfJt3GNTNI-wrDJBGGGGJZQww6oFDu8h7T8UV2SbVWgV1Qje9JCOZQATcFcGB0h83wU1Nnl9ASoqwxDUhiA057xCHQMVDsPYBmAP0c6ODf4H3x9JB57hTQ-Fhkz0YtM+mMwoZsg0RRjB9o7pM5nWwQA-DnsSCMNi7ku4b8Jh3zVALARnDMBHhEAdoQGD8HSoAhRtEkKAhCR1UiQTCV8AEAAYYDemcTfpocJeE3gnS1mX0HIX8a1gCa3iAnOfDRyRVdhYHfZmoMmSddfQfoV4BMF5TBB0+f1O8FNR0DCZLAr4YURiIPa-tU2YKMnmSQfAw9Ii4xRXoiPzjvcGeOgB+Lp08EQ5O2qrblnEJf7XgL8FPabHlC9B6geRPjOwDKzCR89fQ6o8YZqIg7-si2frbAayIlafgfqpJP+v4EfYegQkGGFKA4FASpQrRSbW0d63nDL4aAcBdANLxDCu56QhuTjBjgx5B1bOSYh5CZm-AeCMxh7O0Y6x7bPDHRCUC1r8ElJciecQQDhJMGxAe4-gIYHRJYUVZajIOp7RsdLzCSIxdccor3L2NNS-A70OoYcf4FHHBjGxyyf9mkjSAEiIxoJb0lil1DGZKhucXFL8Efj3ZAC3wCIBECAA
    id: 'authMachine',
    predictableActionArguments: true,
    tsTypes: {},
    schema: {
        context: {},
        services: {},
        events: {},
    },
    context: initialContext,
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
                            }),
                        },
                        verifyingEmailEligibility: {
                            invoke: {
                                src: 'verifyEmailEligibility',
                                onDone: {
                                    target: 'email2faCode',
                                },
                                onError: {
                                    target: 'emailInput',
                                    actions: assign({
                                        error: (_, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.message; },
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
                                        error: (_, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                            on: {
                                NEXT: {
                                    target: 'retrievingSalt',
                                    actions: assign({
                                        googleOtpCode: () => undefined,
                                        googleUser: () => undefined,
                                        registerUser: () => undefined,
                                    }),
                                },
                                LOGIN_WITH_WEB3CONNECTOR: '#authMachine.active.web3Connector',
                                GOOGLE_LOGIN: 'googleLogin',
                                ADVANCE_TO_PASSWORD: 'inputPassword',
                            },
                            exit: assign({
                                error: () => undefined,
                            }),
                        },
                        retrievingSalt: {
                            invoke: {
                                src: 'retrieveSalt',
                                onDone: {
                                    target: 'inputPassword',
                                    actions: assign({
                                        salt: (context, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.salt; },
                                    }),
                                },
                                onError: {
                                    target: 'idle',
                                    actions: assign({
                                        error: (context, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.error; },
                                    }),
                                },
                            },
                            entry: assign({
                                error: () => undefined,
                            }),
                        },
                        inputPassword: {
                            on: {
                                BACK: {
                                    target: 'idle',
                                    actions: assign({
                                        googleUser: () => undefined,
                                        registerUser: () => undefined,
                                        error: () => undefined,
                                    }),
                                },
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
                                            active2fa: (context, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.active2fa; },
                                        }),
                                    },
                                    {
                                        target: 'software2fa',
                                        cond: 'hasSoftware2FA',
                                        actions: assign({
                                            active2fa: (context, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.active2fa; },
                                        }),
                                    },
                                    {
                                        target: 'newDevice',
                                        cond: 'isNewDevice',
                                    },
                                    {
                                        target: 'email2fa',
                                    },
                                ],
                                onError: {
                                    target: 'idle',
                                    actions: assign({
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                            error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                            registerUser: (_, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.registerUser; },
                                        }),
                                        cond: 'isNewUser',
                                    },
                                    {
                                        target: 'inputPassword',
                                        actions: assign({
                                            googleOtpCode: (_, event) => event.data.googleOtpCode,
                                            salt: (_, event) => event.data.salt,
                                            googleUser: (_, event) => event.data.googleUser,
                                        }),
                                    },
                                ],
                                onError: {
                                    target: 'idle',
                                    actions: assign({
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message) || event.data; },
                                    }),
                                },
                            },
                            entry: assign({
                                googleUser: () => undefined,
                                registerUser: () => undefined,
                            }),
                        },
                    },
                    initial: 'idle',
                    on: {
                        SETUP_REGISTER_USER: {
                            target: '.idle',
                            actions: 'setupRegisterUser',
                        },
                    },
                    entry: assign({
                        error: () => undefined,
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
                                        salt: (context, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.salt; },
                                    }),
                                },
                                onError: {
                                    target: 'idle',
                                    actions: assign({
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message) || event.data; },
                                    }),
                                },
                            },
                            entry: assign({
                                error: () => undefined,
                            }),
                        },
                        emailValidation: {
                            on: {
                                VERIFY_EMAIL: 'verifyingEmail',
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
                                onDone: 'createPassword',
                                onError: {
                                    target: 'emailValidation',
                                    actions: assign({
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                        },
                        resendingRegistrationEmail: {
                            invoke: {
                                src: 'sendConfirmationEmail',
                                onDone: 'emailValidation',
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
                                            registerUser: (_, event) => { var _a; return (_a = event.data) === null || _a === void 0 ? void 0 : _a.registerUser; },
                                        }),
                                        cond: 'isNewUser',
                                    },
                                    {
                                        target: 'idle',
                                        actions: assign({
                                            googleOtpCode: (_, event) => event.data.googleOtpCode,
                                            salt: (_, event) => event.data.salt,
                                            googleUser: (_, event) => event.data.googleUser,
                                        }),
                                    },
                                ],
                                onError: {
                                    target: 'idle',
                                    actions: assign({
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message) || event.data; },
                                    }),
                                },
                            },
                            entry: assign({
                                googleUser: () => undefined,
                                registerUser: () => undefined,
                            }),
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
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                                        error: (context, event) => { var _a, _b; return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.message); },
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
                SIGN_UP: '.register',
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
}, {
    services: {
        completeRegistration(context, event) {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('Not implemented');
            });
        },
        confirmPassword: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        sendConfirmationEmail: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        retrieveSalt: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        sendCode: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyLogin: (_, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verify2faCode: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        authenticateWebauthn: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyDeviceCode: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyEmail: (_, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyEmail2fa: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyEmailEligibility: (_, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyClaimNftEmail2fa: (context, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        fetchForgeData: (_, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        googleLogin: (_, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
        verifyGoogleLogin: (_, event) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Not implemented');
        }),
    },
    guards: {
        // @ts-ignore
        isNewUser: (_, event) => !!event.data.isNewUser,
        forgeClaim: (_, event) => !!event.forgeId,
        hasHardware2FA: (context, event) => {
            var _a;
            const { data } = event;
            const HARDWARE = 1;
            // @ts-ignore
            if (data === null || data === void 0 ? void 0 : data.active2fa)
                // @ts-ignore
                return (_a = data === null || data === void 0 ? void 0 : data.active2fa) === null || _a === void 0 ? void 0 : _a.find((item) => (item === null || item === void 0 ? void 0 : item.twoFaTypeId) === HARDWARE);
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
            var _a;
            const { data } = event;
            const SOFTWARE = 2;
            // @ts-ignore
            if (data === null || data === void 0 ? void 0 : data.active2fa)
                // @ts-ignore
                return (_a = data === null || data === void 0 ? void 0 : data.active2fa) === null || _a === void 0 ? void 0 : _a.find((item) => (item === null || item === void 0 ? void 0 : item.twoFaTypeId) === SOFTWARE);
            return false;
        },
    },
    actions: {
        setSessionUser: assign({
            sessionUser: (_, event) => event.data,
        }),
        setupRegisterUser: assign({
            registerUser: (_, event) => (event === null || event === void 0 ? void 0 : event.registerUser) || undefined,
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
        }),
    },
});
let stateDefinition;
let authState = localStorage.getItem('authState');
// @ts-ignore
if (typeof window !== 'undefined' && authState) {
    stateDefinition = JSON.parse(authState);
}
let resolvedState;
if (stateDefinition) {
    const previousState = State.create(stateDefinition);
    // @ts-ignore
    resolvedState = authMachine.resolveState(previousState);
}
export const authService = (services) => interpret(authMachine.withConfig({ services }))
    .onTransition((state) => {
    if (state.changed && typeof window !== 'undefined') {
        localStorage.setItem('authState', JSON.stringify(state));
    }
})
    .start(resolvedState);
