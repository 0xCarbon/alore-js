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
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLIHO5fMFx2F1QudUQkvU0ve1jlCqV9lJDWmfQegVaHwsWluhpiKxNZvyrE5mSFFTRoodCHcFj9-RMwPspgM5gs3rV2l01gE3V1bxeboMYZhLNNeFS5AAYqwKJzWEx+bkaDQAOqtgAi8dOdox4sdAj6YzsRJMk0+NmsBc0xj692MthCmnUdwstj6NeNcIbWwSAHcwAAjdTMeSkBsSABOOjwd7AJ+IUDIbHYTfSFGwRheyoAAhdRGGjWN2GHSoRXtTEEEeOwHgMHwvlzHd5W9dw1x0PprGBKwp1GatIihI0I2PRsdAva9b2Ie90CfHQwAAW2QQgABt0mIMQMDIAA1KgKHSJsAE1GCobBcnSfJJMKWMQNk7IxJgxN4PHRDTCCFC0KMDD3gMbCQTGfDCNMYjAlIxZw1hVkTzSGirxvN8H2fNJH0IAAzZwSCgKh2K4qhOMIKBCEvLiZGcMgIHkBISBSCQAGtWQouz62o2iXIY98mPcsBPJ8vyAo4zjgtC8LIvQZwEASiQ8GQUUyjUuCx2ULETGldRyTuewDKwn4U38PQdEmczLKCQ9KPszLnPoxjmI87zfM-EqgpCsKIpC6qyAKx9mLETjGq8p9WNNNK6zZJy6NcvKdCWorVsCsqNsq7aarqhqmuEFrRzFdrEM6loeuVfqjMGyVczwgjOgsiwSKm9Krqy+bcuYtjSoMLzkFvCByCEkTxJYfIZMA38mCkmS5IMJtcl+9F-vqW5-kVTx5UMcxDOw2x7jG2GJus8jbMuhzzzm27FoK5a-OYI7CFY9gvPQNbOKx5AYri9ZEpS87hcjUXruyhb8sKlaoFljiFaVlW1dq4hEq+i5mpRBNWsZrELEecYCL6W4Ocw8GhleWxofG+GrMRkXZpunK3PuqXHvNuWreV561d2x99ufQ7jtO3Xa316OjbRk3pc-C35cV1PMexu2Hcap2fpdkcGeTEYvZsPpfb6zmBqDiYxj5ojw8msimWmjLT0N1G48ICBOPZKh8ioZgmB-dgV-oVt6aTBC5Q1N0LBedRfd8SxsO6rxUKnARc3lGx5jHi7C6nziJDC4hzQYAVGGoWMaC4BQPkdAKA7w0gDEsbQ8Kggss8E+HQSSDXlH6EE7g8SeEnBZA8T89ZUVfu-Eg5p6C5AoJ2bsNAADSVAJKQTjM3WCf1kzOlePoNc+ozABjsEuQatwLL6D0F3N0jxnQjEji-Ryb8P6JHnuQWhPJezZAABJAVAjeDgG9V7b3oepNqTMqReHeDqTwPh3gjHzDwncuhVyLiPsgkI1gxF4IkQQ4g0iF5kHbDGZeEEYx0JOAw1uCF2bpjdNYXoa53CBG9LqAwOhgjGE8H0fUeh-CtEcTNfBUi57uNyAOASuR2DMCoIwLejAuw9n7BQIc2i3bJiaCwgI7dgy6kCOYoY2l1AtBCJ8Vc8oCKhhwQXJxCRJEkDceyLkPJMhASUWU8hVDVI1MYQhIwegvC2BLAI4EjxtLehGHw7S3QiQ0hBBs9Jk9nFZJkV-Zeq85kVMHIwbADBFGsGqf4nR7sUyGBdPhSUt9SzkgIns4IzQBGPHlPqI+wJwiDKPBky5YzsmL1uWQh5VSnkvLeUcD5tSEJaElOMCYJgOi2BBOoPZoS8IpPsLqJU25zlXVGa45FNzN73L7I8559BXlDgMLi5Zml9TyjwrqUsntDJym4UMfozoARWBCJYX2U5BbjyRgbZl4ydDSCgMQXsMhMD8mQLAWAKVop-iyDQZR5TKHUJ8VBMBujEAn38HE+UntyTOjeE0bC3Rmj+BzDqSwJZsE2SGQikZLitU6r1Qao1JqzVkBArkZgFDHVfM6CKuUvgUlUkMOfCGfqHg2F1B0OlaS4UTyZVG5F2rQqxqwPG01YBoo2oWYwdgHZGA0AFPyVsXB3m2kCZpV4wRvArleAI+GrwBgQ0lFfPQoI9xmOJJORlGqa0yPzjQPAj4wBgE-ha9IVqOXtrkemphY0AQfAmNod4hlEFBzdCNKkh9uiGFxKq5+wydCatrdCHde6D1kDbXaztTAe38j7aQqgg7XaCoBtfe4K47i4gIrqYM2FAi6DhgEMw1iBB6HXdRP9W69pPjIEek9oGaG+Ogks4dAMtyxMwdpWl8NyTYW0H6SwG5u7+G6HKYjmSkVkczhRmjHau2QegwOi9KzgSdISS8N4xEZ0XypC0P5NIT50iCI-MN8KLmRqkcy7AYAsASAgDQMAC8TzyDZXcm1lS4Mt13ppNowJRqewIvOUsZg9mKliV3Nm2l4aKmdMJxFrizMWcwFZmzdnRRJpTWmhj7mIH3vGJYFJ6o0wvD2V3Tp7RX0zFQgySt6qSNRr3egTyYAUh+RoMgTi6ANZrDqjrNVUcROuNq-Vxrn5mutbrvVBu8hnYCsY-UTzfo0zztsGW4wezJxeBLfUoIxh9T4SiyZsZ-XCANaay1tr5Hs5HXQCdR8Z1uviL231izA3jsjc+uN4gk2h0ZZm-0dMgRbj2MVKWWdQxDDNH6OgqcLxtK7d-TW3iGAm1nifBAFLqb5MeZPs0V4I8wmbe9GmTprNbhrhOcgmHf74foER8j1HaabTwem4gJoZhqX9G0B0nL0SoGKs9d1AIBFYWGarRurJlPqePhR2wbA-Jl5cEYJ4zk3iLRTPo1Nr7TPFTNBzKWDpsqRh7MJHhOkHRbhHzFQZoW4bjOw9F3xKnxrYBI4l4JYSolaMOvS+AmbMTvZNGBLmZTFLBp2F5lSeGSStBdE0OTqND0zb5Bce1+K9tkqpVwRGm3Yy49+QTx-UbjsJtNzV17xAa4-CjVTM6QI+EQjA8QL4Zot85TagD57C3t2f2auz5+XPhDYodZT1179Geu8J3jy4-Pb3mr07cyXhAXcfDeG6CEUs+oC1DCPmMFJW2Um30MVSGPUju9QF75-fvyftZp6t9Wo-Y+c8T9e99IQfB+WfbnwvsYNJgzdT8MENpWJV8ARyQ7BuojACID9Ksetot45TZ78P4k8tZU984jMb8s878e8H8U8C93sfp1Bi8nV58nhssCdyVeg+4sRmZ9BV13BupDA29D80DYCMD4CzsdAc5Ls84O8R9Y90CT9MD64n90cIE1xmg8QSxJgRgpwg8hg1xP8vhSw1lb5-BjAGDXFYBUA8A8A4BYAvJUBOJT9KAqAmxERlEU0ikewSlWAqFVc38CDtB-l5UT5fBiQkl8JvQUkxh+cNxg5ZgzBVDtUJAlYzxkA9104fw-wAJu1ewWA3lShPcCDfBeg8Jtxt9Og1kolBo-sdAmhF1vUdw6QLJ-DYBAj0BgjQjsYyBeQ6BGBFESEBxewSFikaY6Z4ivk7gNwAQYk1lFwpxH1S8BE4lEiSxtxTcOgiiSiyiwB05k00dWjkwbB+gWgcw9xgw4Z9R3CwkHgT5q9ehuhPZBdLcUCRdGCy4oA1ZcZyBz9ECh909rdR8mCzjsYLjJ9BC5iEI7BDAHg+k9xekIUNj1lWg-8PBtwIChcqtesYDTjzirNLjNZOsr8jjqtb8HjoS8YXjG5n8Z8Al1cEAaRtB9BPhpgQ1yCEATARoBF-BZVYZJh29h87ieCUSniYSM4s42CLsrsbs6TUDXFj9USwB0TC9n83jNJEjkN25txtIXgPB8cdRsjgRn1SwqQQRQ1DjhckSxlMAQiIBJj04qjikaBWAmx6AGjqBGBmihD6h2jeYkkeYBdZxvRJTNQtsSxVxu4LB-DNSJcdSKiCY3cajojcheQeULT69iRG8dlSC0wj5vQdw-QJgisPhQRQQQQDiuD6SpFPTtSQipiKiZi0t8Cvku5zBRUjAJhj4pxpVnV4ZoF-B8IttLBaz-DSAzwBwjstDvwOAIjAIBwqABJ0gikYieyQzcS3ReZPgqRxVhEudOl2Y1829Yz3TIC7tM9XFmzWzGt2zEQqB2ABxBy4iCzkwj5izYzF1ghsR-9EJkzvNgwUlm8NxCN-Dj8LiED4TkC1SISnyYSBScChSDyEIekvBNtVxnQfMSSpS4lQQUkpwu5PYpxHzeDnzWD2COS3zwToDPy0TH8MThyNwUl9AJVzBUI6RUIVt9QHg8QNxYF99-C91YAD0IAZZ5AvJCBrs3sVYXzB8ET3zoDaL6LGLiBmLWLRQVZvyPsGccT4ZNiqQtBiJvDOg9kpUAQVxehATgw10lzO8o0MYuJ04tydy9zhyp1pQgdJwScnC+jEIpR5VQR95kk3R-DtLVYfTXciZKZZIzTaZDK0w-RCNb5gQEk2grAQVPh8LCTArSxEkHK05czUthzzAWcSwbB9iPhkEDdQQliepPBgxPAiMNLuDkTTibYKirjXy0zuTITE4irkBRKi9bCvkrBdRNRAVMJjkVQsRttxgTc6Qky9wAh4KHiqqWSDp2TOCuTjieTeCqqarfy6rkxq8Roj57AtBLAuFKzEJKDF0JgaDCNOgGU8r0z9s4A+KnpSpnySrOLUKoD7sdBeLiAGKTquJnisLBTDK7hdBHg-YfA74CseFD5xga89NJTtIHF9ryrj9FEzxcglgOLL9Lrlz7jTiIaoasBpqcKVw4zcxggkkft3AYyWcFi9xejtJVl+rEbIbobzrYayrxqKqzYkalhUasTPlkw6Uxgdw7gQQFCmg1rnR7gCaCIehARcqwSrqVzaa-J6asAhrztc5rs4bNKCrE5JbMBUbhSAYG8UFNxvUJgSxpCmcEk8IQRtBaztxdr-CvILNYQoAmwnwYABxGp1ZKakDqb1TXELb0ArabbHw7aHbVa-yhUAxQqd9iQbBYZ3CQhsi-MQ0oK3hzbLbVhrbbawB7b0B1YkKRq5aXaIT3bPak6U7qrnqfzhznRNMrBicJDcwBEHS3QgDcjuhuqIrSbE5OQJB34F4DCnabjr8abj8W626wBT8-bZqEI1wVwHgOgBEpS1x3hKU1lvY5QjFPAdxcwm6zY+6oB27E907ZbOTbiwbeD17N689C6xLZ8CCCJAhRpdbBN6QgrfqiR9BbgZ0Fwj5aS96aaoBW6N6B7E9O6uK0LrrP7+7B6T7arxL39Ek4kUNrFcwQ6DckkWhVxm8ZK8MVDQaP6v6j6+84SLqs7oCgHv6QGsCp8foma8VNJ8JyRvA3g9w9ikkjkQUj4HggVDBvVDAjB-CCGsHP5t6ODM6xrXadAuGf7j7iHXj-aIF9M4lfY-V+NHgQViR9BLAOg74gQkkaLHtDtBtzY908ZiBZAWsKBmAKAYbnaBGISDsjty5dGD0DHOIjGKAh7wHz6iDiQQRNrCMyU9laHx00wP195bANG6stGZYbH9HCBDHjHpa2Sd75b8rDrgmrGdHIBbGIn7HjGnGz6vkwkKRctsbJ6y09lF1OlCMQtCT2G7gij61QmUnwnImTGqNrV5k7Vz01aZterRoBNeb-APA68UxyQr5nD+klVSUqndUam9G7GHHadhz-LmgmhMFUJsQElvGcwtidR3hBNpLhbVSAGxaY0JnUn6mZmyGEN6gkkkighaGLmj5b49kzAwVOgT5fZlQZKxniBDm6n0mTHJNwNu1e1+1YNZnJgwU6RuaQXtw+nbhtxOnyQKLVMVS8HrqDnrHampmonfnpMAWYMhxTnGd59PBeYYF8QTIggoX4yiU4W8xJhbFV6-IKAwAwpYB0ACp+RUBLwQo8AKEW1mAwm7HTGu7ESPzeCGWmWWXHw2WOXCAuWeW+W0nMnsS58eYDF80bB3g6QtBjINQiQJTJ6KxHg6XPxRXCBmXWX2XOXuXnBeW0W0mBX-7RaEbE5jXTWJXzXpXLXrXJn5XQHMSJHvcNQy1IU-HlVjIdI9QyWRnXg37u7BHj9nXxXJWLXZWbWWs7W4mDqJqHj42zWpWZWrW5WWtUbX9nHsmzBB4FiySPAdwLysb7grBVrCMttDWoBs3XXc2PWC3OI02kWxa43GWTWE23W83PWjnOJUa8Dh6KHG3stRzjF1W9aUx5QvAFDWZiR4Z9Rm3W3E33Xk2vXU3eGUKe3HWzYt2h2O2U2x2fXhzQl7h+ltIiR6GklfVuhpGQSRjtw-Bo2hX0KRX+2XXt3h3O3onkLRr37Y3f2xWc2k382L3Ga-WqztIAQ1xFQTA6QTBA4PYI62gwXLAbKOgv3uKEg91IPnxWUrVWBojAFsAaAnk3kChgWx0ekQsdwF62qfQ-LpHFQVUrAQ7FyRblziOB2Cpxkv59K-5j16AKBcgcgOBJJpJZJr2rnvAyCixBE-dlw6y4lWhJTJgPCYdBOXWRPcl8lClilSlnNBxZn3BdB0j67UI-s+mbhuolN0P+hcwj5g59O-3xWRO5EZkeUVEwJ15N4tF4PEJfAt8CRAUaQb1CtcIYFP3JwpQu4vOSOROkQf5xOAFhJgFhJr3AhpRekfBTKZgLKbhbFvBQggxZwPho90HqIDOfPWUFdvFWmwvT5itAhDBdxH3lwdNsi9wBEsFg53hUuhPnxxXWJYBsArNU3mBoxqiqOaPsA6P8hr3PgRp8Jgw2hZU4W+u+Fb6CJQCgg+r6up5GvhO6K7ripnpu3zHHILvnwrv7r-JnoFXmaR6sspRHgRDR7HO5RSwr7rP5T9QDQzuHvvPLvjrXvSpgOM7d6Y3zvIenvoeRKr22mmdsaUJc0aVcR-u1lpQzdLFn1uu+PdnRbHuWJnoBIWs543sXdCYJI3K1uMeEAdb-VTF6RoWLybhFRkMAxMadQb0yee3KfHKaeQoIB6e8yrOXhI7rFgw3hK6NPiz5sBmcItsIRweiPkeqfSoJe6fks9Ldy2AhzWepxF1xh4ZbhPNcwVxlwUlb3vK-GjyCO9nKfj92K-702roPfJq3v0ewuLJEP7OKzHfZhlxFeZQfBAQlePAxvDPPfbvvfRfdek-So4PJ2AZNc-R9Eu4RDtx4Y+vCNEHPgyn9lAntebq0--fYeU-7ude0v0+uIi2g-UMARGku5dOwkyuVw9xi0Nwy0zI8ME+fPm+u2D3QPEeIem-a+W-A+s-6hA1RCelt9bE1wNOKRfLtAUqb5Y6q-Kfd0wBGowBxdJdWBpdZdiksvJPpP0gOBDLdqkPHgTI6y3Rlw+fsifulqdRre3eKfdeR-E-mf1pyWFGA6QAcMvEMr2Fa6KqOdnxgLAeBFQo0UsKgkWp+VR+wnIASyxAEy9Wei6T4n4CfqEZGkdzQaGqBIHeBJQX1LcEeRBr8cf0h-CQKxEOgWZ6W3nR8PT3r5gckeaXV8CwIXiyAjWHAt7O93IYAxOEynAWiQPHLLZyBOyUQj9zpCrhdwWgTAc+H4GsChBLbEQclkn78MeBM-cbi+GYFaD2BYrTgaKDEFnNEAU6EaL0C2xfAEkIJSPiHADwrgFwdwCtAwIzyU9UAdFR8NaxP4o5qAxhWgKYWYDmEaOW8awsOU9jIQ0OFkW+MRX8CR9tWJgZdGGSnTqDq+z3cwQO0sEXAveODKmg32r5pdbqL3eNoUPkBo8xG2Fc3rIS-5INFQQQW4B-0apP1nCkoQipKByHCMO6JQsxoYMb7GCBh-BMbOI0X6IAtqYwXaskj5xV5I+wYahqZR3AJJb47gfoZgxEbYMB8pQkYeULGE7CiGAhbCnixxITBuoo0fCGslaAzgAs8gulN5klCZhQ+3QbYcAy3riYZafDBHt+1GGGdxhojM4S9XN5pFEGjvGGIkQw7DA0wzQHUNslMRud1KPg63JT0sbaNIhJjbgdP0BE+dMRMsDJgvxLbzFgKeEVoL5UBzZUCw2uJfDOnviTh7AOQwkeXCib6D-hhHI4YZ1ZHmxiR9QsEUHx8zeAqQYLMEKuDkGqgNucSGdLlheBl80GaI33rrzfgNROI2ImgPWkoy7BqMzTCSDfzy6s9uoW2IAnYB6S6gw8bHRoJ0hvI3pVwnjJ0DkNVEtYNRWozFhBmxZyZWeqEOXkkihz2ItAhgAsB8CUwggaQ5ISGKdyVEGxKezo9UcY01G6oQMeoqTB6KgyAtcWYXH0fcFyIxdnCHxAsCIQBBr574bwQHHV2jENcVRY2eMRQETGfw8BYXY0TaPfTmj3gnOcgZ0BYzUD8MNXR0Qf2rFqiHG9Y7UZaiaY9h20gZYMkaJDSdN5RYZbDl3EQEEQoG1AuwDAkMj0DyeAnQcfUxHF5kwBEAqAUaNBAtizRq-S0RpzZrmi6QfY0EtuMYG69gi5wT8F7WmYAISEaKW1O7j8TTCEAxohdMsQDxvBnQ2EaUNsjNH+BCaodHIXkM-AAcR2XzO7ocMp5wSoACEzttYPxZ2CWghNSkcqC2wFhws2RTZn9zQ7AhYJ0PDCRezh6xNU+aXNCdRL3aXsBRRdVnsoMbwhBPYrwq5jzynR4QrA+kHcPcK-QoTdej3czJZmsy2ZcoFwRzF+JcxxV5sV9W9N1DJRWjHgAxV0tpyLKnxFRD43weJOR6ST4s0kpLHJI-GkJT0dqA0aAnYnmBc+fgT4CuA+BTplwUKSkHsUcEvAz4LI4yXFgSwyT7MDY2KuxN-x4RZCIFXpnSHclQxF0xIR4EujeA7N6Jxg3kdM1xEAjuRBIzRkkwcZYScSgQGwN4F8AR4PgJkAsO2IBCT1tQkOEsKJLxHZThO6U9kT8JiZ-CfeMYoyYk20b5SSRWTOarekpB78eh+mYMXKltG9iHR941KYZzQnI1DUQ7RCfy0ylcjUJ0PBaUxNHYFS588Q9MCFmDC0MCe-3ZQhFM6BOTQQIhf-juIYkbSlgW0pCRyM6lVjbp13T8JtKWmYT+pirBIpIQBD6R5RmyKkMuASlQM2cRUxdEEC3E9srsn9e3CaidwQB0u25E3rEWgGiEIxklAINCk0CID8O49FcPAm0CkoUpZQ2GRIHhmO5kcInLcgpMs7m8SwcpO4DIw+o64+ulvXop+3CweBoZZM22hTLP7apoeZ1IYYKy5HkzKZiMoWW9PNhflvpH3TSBPViRygyyFvdGjzwJAQV50E6GlKmT5ne0BZDuKWWhMQptSQOBgxqRLMFkmy5ZrE0+j9PqqLFccVgAMEGhnqdjJwXUW+PuHyz849Zhwq2UbOpnNkQB4Rf8IBAs5VJXqcwnNCfDvh3weekhLwAvj0zPBsMIvfWXDOtnIBtGIA1aXs0DkIzqZsAHOX5DP47S7CxorpF3C2QiICUkfKcNIx1AWQ2gWoJoDDkLlUyJc2qUufBKDnO4npMM-mZLOLm9z0J-ciABXLaIrD5RuIScJgknAO85efOZUr0QSSIsyhpGBeLDjVFNozUI4xptZJ-E2FSR+KfiahBCCoR4h9gSYNzGQHggPA3hEOqTMOFbzI0u8h3PvK1GNi-xgJewf4DtLmBtAhEiGK+n+lFY3guII+P4VrRxi95LaEce6P+bpicWxdN0LoCPiPAek-mYnFhl8D-UuESEcFrzNfmbpt5AGI-sBiRAxEdyewDgAUD5DpAj5xdUEGDjQRqTQCaRbCCWhaBrJ6ku1TfBvLElpc4xw4rUXqSATGMqA0nYpGYVYC8hOAjAECEGVTH2pfxp8oVG3n9AYZhi86cwERN9j-SA0+iHmNAoHFpcxAn85NsEJAgYB2AFMhaaky+iQBQBpSI8fuT-G2BFGhfathPXWEFgOESjX2FjQ+qmIIgZEYgDCXgAVAuCf4jQMvLaBrIux9dcJMuPeD8JwxboccuVnORJBRYcSpZko1Wz2cHBAQRAX4B8oNUngwIJyS-LxGeKmgTM2BLSCLBlc-8L6FOa8BiQ2AYcKMCWI+D-ESl5mn6eBGfBraXTNQHwZKWYG6gUSq+fS2OHdFfCLK-Igyo7uPXvg9wA43MQHmZH5gjwGpWUhZcbD15cQeIduNZQgzZiV1-YXMCGK4SvphwEY8y8WIsslgDVno5UTaFVCGADS946y65aDF7iwjcwdIUOPsueWVip4xykuKcqco4wYSlyzpICq2V3Kg4aYZdtCLhiQqDJ1uGFXHCfLJwq4VVJFRspuVgwwJaYcFcPBxU9t8Vd0RyvREEqsRIApKlFbcpJJaAAgjyiFRHBeUxwTlyKS5YVzFRtBW5tBEFSME6SBjFeuabqFYFUJ-jIYI0ZTJOjUxLiIYFIX2EgwpIbgNwWvKFdASFUaLEMnmcdCpinRksoWt5aGGfFw758dsVfN+XWl1T6pG0Vi35Q7OTCrJlZNlcEFcKzD3M5enNIsOhyNowKt0FCoDP9AVmIZ8QVBbNLYFYbyMIYPCxLmEnlAmJJgEa7eWdiVVqVqU2OekCkrWruBiyFkZhBq3BBCLGpmqWLFJMSyyS2osambDhDlKNJ9EkpNjgvViQcII24BIkBnNIVSJeRw2dAJ4rL4oCsE+Ee9iAplR75cJNICLLhW1AwKxcE8zxWsmTmUVOgzc2CvjjuBX16paRCKhwydUMlTip+P8TCj9D2BEis4Q6a8HxyMyTAwxAXEGB6XnqpE6hTQtoV0L6EXEgy2+IvgJSm172rQBdvSHwp3AqQRIZJMSHGJBFsyasP8V0BzGTBR0sDfxTwjeDFhMwHxQFK8ArG4r96jJBFXjFQ2JlBie4HLClU9juEPAcpJVAvjlD+APSWpb0sgD-F9QXQowAKpuFXAxkBi8ZTcEbTTAfCv1YyNcm2TACobw8DwMuuYEjyHSVsJfINJfFXRaA-AzbC4n+NLTSgjuoyyuiEGiRj10MKSQkOFgfKSaHsNsgSixXYjCVnoemnav9REJ4YLea1RJLn22yij8OLpKKjXC40mrLSFLPwN13vRl5JR7VL2O+trJlr7OzbElSFvrwB4bhimIXs4NhEfscMKjTHPhByr+za1NWI6jLJVi6aUtpJSFPhXALh54pXm71PoFXmJSP8Q64rYrTprk0sAlG4qZ0E2wECZwsIljvPWDbEh1hcdD2gnS9o+1U6v87KvPX6SQsSwF5RTJqCMDrCTElfQ1ddV7onDANlWslPcF2pC9UOG3KFm6EJxLpC+aCQxJwz20fxr1MlYtEYGUphifuClRmR4OPVC8G8QTJ7Ki2YkONPFgJf6jtW6QRiF25dSEf4zXDJTrpCtMZCi2SaA7jG162kFfQ+LYhZC0W8LkkUrboLhErGzdsjwA7ntmJnilcMWDQ64d-kngLjA-WZi1Tg0fhcxeNyVXod-q2YcTewg1k-4tiqEMMfaJ8BFasplPY1X8qnZvB+EHnV9Y7yXnTg45nsJdW0JyGTdpus3TiGjprqTB55z6X2D6k7HbhCct40AsTTMXbampKPMrc5oO0PL+gUwF4HejcLyDoKSjHvpCkVTQ5WdhncXrTyl4ZYW1peEPO2oVAZCxV-3NVvwnVZA5YGoib3WPzn6a7KtarT-AVyJCTpWYDvW+EpQcG2ItNgQHIdgNP4brKtBAhEQoVmUJIBEGkz-qOWQ5nwyU8OwyXwNMGCD8hzLGoTGvEGWkQJ2RKvEVg20R7kBde8wNJX3iHK1puvfwQVCCEssIAqG1BE6WebuASK8g1odkXELbZf8vgCfe7yMloTqhbFG3RLoBjykXQ7wDWoYG6CwibgMGuJBuHqS9DFqnwwhvtpP3nMa815UURWUwTF9P8D7BkYOv0mzScpPUokRQD-Fcdl2ZbekDQX1zkCcwyKyer1W0i9Bd9AAkRTWNdG6p81jMiyFzrg1XyCwEG4se8Cmmbim96I3cd83rG4GcMyU+9r-h8DlKuorc7NPDAtEKr49wnZ8doLfGo7KtmaegwQaYN8TmgUZS+YCHcadBKJMsh6XY2409Dr0i6GGD2KtHwwt8YqnLDmC67oGbpaU-yQ2qCkB7u9MwpKtkUlCQ42hbwDTl3BlH2I-+nQXUH5LANGsBD7+2wewmII5gMMvNRzjrQG4zAjdvgB-bIZe4fTc2y0tJqhvBydVEDy1e3QuxuDBArEfuH2FOnj5V9O5iMidbEgvrNLWZxIRAdMArwzrrOW6sHhbuyPUzxdXqz7oPFg3zYd9TzPGWOk8CEzhoeJSg1dGqPdybZFGyrU7qvq0FZgv-SUK0bBTezTcKmIXh3OHmCzXweMGzPo0GWzh-qyhMJCEAESLzDdhKU8vKFXQpUUkcxg2SPO7khyS9HhtniMHGB0Nu4Ks4IA3NiQhHF0bOQjBOhONZyJ5Pc3OZcbqOKykuUDHUFth1DudgZ8g5SS8fJAyMCeehn9L0aRmWKi5EuZrGkHn2DGa5pB2lB9UDRJHJCvyIXkBKrA5r35LWeBc4FoOVbCQgFbSODg6ToZuFHwTpkYBUwA81kOQpE82hg42K7FDipYE4uCFZ8mIYgNQGW1GiO9aURtbGU4AXhKwmcE5R+vpDQ4TonAl4CmUxFYiimQQ4p4aOh1pAZFPIUATAOOoQA+wbOSs5Uz9TPBzxutiEEEE4EwBgBQoxppnOYhmwKmklHMfTTfrFOEZdTYITSYuQiBAA */
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
