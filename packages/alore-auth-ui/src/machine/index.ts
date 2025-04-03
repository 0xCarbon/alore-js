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
    /** #no-spell-check @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiALQBmAIwCAdAHYATHoCcANnUAOUwBYLevQBoQATzUGDmzTuMWB603oWBuohpgC+YU5oWLgEJGA6JPiyAG7kAJLs6fTpAIIAMukAWlSCIkggktKy8ooqCBrW1jrq1vaaBkECVqaaAKxOrg2adhY6pgJtHkZWbeoRURg4+ESkicTJhGlkmdl5hSV8muXiUjJyChX1qpp6pjqavbfGBn161sYvji5qI5M6QXsfQMAhefjsCxA0WWcTWm221Do-GEiiq51qV0Q2jGI0+QWmrT6AlMgzcAk8LWsrWM5NMPjakOhsVWCXh5Bo6QA4uxGABVAAKZVRZxql1A9QMVOM+iammswVMNgC3yGqncHW8NJpfWMJnUr0ZS2Z8R0bLI+VYnMyQoqaNFdUQ7gsfQeb2MwPspgM5gspIaHgEumsgYsurdko6hpiKxNZoAYqwKJzWEx+bkaDQAOqJgAiNtO1QuDoQIL6YzsRJMk0+Nmsfpu7vuxlsIU06juFlsfSjMJZprwqQSAHcwAAjdTMeSkAcSABOOjwU7AA5IUDIbHYcfSFGwjEzVAAQupGBarex85URUXMQhHnYHgYfF9ve35X73H17n1rMCrGXRgYPbGnCK5pDoI7jpOxDTugc46GAAC2yCEAANukxBiBgZAAGpUBQ6RxgAmowVDYLk6T5CRhRWgeFHZIRF52te4pYqYQQPk+Rgvu8BjviCYzfr+pj-oEgGRFCRoxiBg7gWOE5LjO85pLOhAAGbOKuVBIahVAoYQUCEKOqEyM4ZAQPICQkCkEgANaspJsKsqBw5yVBMFwcpakacQUBachKG6fphnGegzgIFZEh4MgoplIxV4Yixt4mNK6jknc9jcW+Pwlv4eg6JMQkiUEQFSU5MkQfJ0HLrBSlgCp6madpAV6QZRl6aFZB1bOcFiCh0WqXOCGmg5fZsrJkEKTVOieQ1Pl+TpLXBe1YURVFMXCHFhYJcoWLJS0aXKplvHZZK3o6IJnTCRYAElY5-bla5k1wYh-kGKpyCThA5C4fhREsPk5G7puTCkeRlEGHGuSbeiYo7Ul-yKp48qGOYPHvrY9wFZdRViYs0Z3WNFVudVHl1V5q7MH1hAIewqnoPNKFvcgZkWes1l2cN+Ojc542Ve5tX1d5UCU8hNN0wzTPhcQ1lrRcsUora8Ww-UIyPOMP59LcKOvsdQyvLY50-tj12ibd3MPRNVWKdNZOzcLVNi-TTVM51s7dfOvX9YNnO9rGPNE09Avkz5IvU7TTuve9Usy9FcsbQrBYw8Wqv3DYfSaxlqNZXrExjFjf4m8V4lMqV91bC5lv84kEAoeyVD5FQzBMBu7CN-QibQ-aN5yhq1i4sEmu+JY76pV4j5lgI3ryjY8zFyNfsyShEgGcQZBIgKjDUFaNBcBQfJ0BQnfMXDwZtOdoLCc86ia96fryi6ILuHingCJ+6dmwv5c6EvK-V7Xa-1zbowNMGZswUBzIwbADAAASrA8wJ0vFtZWjpPjND1FoNiVI7C3D9HKVK51nTkn6E0To-gP7SS-j-Egf9yCnkyHubI0C9yHgnBwVuTcO4IKYttFWVIvDvB1J4Hw7wRi+mym2PQuhGxNFDPfEI1hyFlUocvahhAa7kGTJaBuJ5LTWi4UrYsyMXQ92sL0T87hAh+l1AYHQwRjCeD6PqPQ-hWiKLLmBKhxAaFkFyDmbCuR2DMCoIwduwD0xZlzEfHhiASEugCKrCw6hdSBDEUMNi6gWghE+O6eUP5bhuLGp47xHJuSMHoZmRhYSMwAGkqAMX0Ug4sRg9BeFsMGPQ6cPCKlSViP84xfCEJpCCNpBSeZFLUf-HeuQKCpnCbU4idDzwNKTjeJJrx9Cfn1GYQIlh3i4LuC6IE35PDmHsRYUZi8VFeImQkJeUUUL8mQLAWAdlnA0H0qvLcWQaBMJATQeZOizxROQQgSw-h1bmEDKlKwnZ3xvBsZ0fERIaQtL0Bc5Rv8bnf0isgB5TyXlgDeR8sgB5cjMGqcC4srQjDjH8D+YS5htDGHUOjVoAJXiOLeLiUM6KPFXJodi+5jznmvPeVAVefyAXsBTIwGgAp+SJi4PAk4iCVmJVaNoAE9i6SfEDPYjp75Ai6CuiIzBTRJi8tufyrF0hxWZhkJgYVBLTJfPSD8qp-y6mAr0Sq7hILr7gtOhYbQbZ3TvDrCdbozR-Beh1JYYM3Y55c0-nyzF6idC2uIParATrXkkrJRS5ZXdEqdHlA8WwAhnFUkMMPSNnYHg2F1B0XU5gFFJt9hQ1Nqj02ZuzY6-FebJVeulUwOV-IFUzKoMq4UjSbyvGCN4TQLw3j-g5XxPutjJH0lEcSV+lrsVptrj7GgeBZxgDAKvJELAOA5j2BwAofJ0gevmZS1ZoJmgdEfKlKkk9OgqkdI2loLSSGdG5YmvGHalFduuem6EJ6z0XrIK691Q6Fm6KWb6gxb6fwAg+BMbQ7weIkhOn3PKVI+4DMMP3fd4zYNLHg+eiVczh0yrHROpVr6S2NgeC23EP5dSJMNb4cYZYAhmEbJWmj1r01dTnEh3YKHmNoaBUW4+9RWw2Nft0+wPhfCaHfNoF0lhmwZ38N0OUUnD0JFk7OMgqHGAjtlfKxVU7ONw3nRk+xy6OnXTXSdVoGTr7yhpNfOkQRZ4QeAlBq1v9PHYDAFgCQEAaBgFriueQACG5Nw9WA6ditZ2JTaMCfKwafzVj1cRoYjwvTnU1nKNi11FRJMs9QuLCXMBJZS2l0U+byVufqG0M+PpnHqmdC8XB6cMntHIzMR8DJ21RfcTF6hZ70AqTACkVcNBcXoBZmsCKHMS4EzGfy1b63Ns+W2yhdA0ccXrSEP1mJHSXTOgjLYZtxhcGvy8I2khQRmX6xa14s7hANtbZ267d2OhPboAGrOIaR3zYYpWwl874Pru3dlvIeWmGCsn36MYwItx5GKkDAMbKhgP06h8P0UM3pzkLdLoU61GEMBOqHHOCAvXC247VSfILtiiqmP+36Z0GTEa3E-EM++QP1iYXQOzzn65WDYH5A3LgjBNGcm0SUnkPqZ184G4qZoXpAzpP6FoHpt5CTnTpB0W4oZdR+FlyQeXivZxc5+gRZT+v8uG5idY9WTRgTei8yy7KdhMZYLF5bkEmhZczSFvkK5e3LLS1svZZNnblteMT6uZPK9Mex2x-HXnxa4afj8PlJ0STAjfhCOToYvhmiTzlNqUPwaIsSSz9Fg91C88+QLyQVPbMM8+0W8z3+A+oBD+IEX+7Rwy9qcQOnHw3hughChcEK3oYxjOOZc4yeAiqQJ9tknlP5l9vp8O-PbPffc9n-z1c+fccHsGCX9EhAq+xg0kSalPw2+X2VeemdgqURgP4J+jOx2lyU+j+g+F+rMB2mekGS29+NsgsT+heq0xexAsU6gH+IKn4FIPojiII-gcousWItwugkiEw7gqUhgnep+GB8BK8kOPUfUsO3siOKaOe6BwcM+z+2BC+qmn+9KzQeIwYkwIwZY4eQwn4P+XwgYLSk8-gxgsusAqAeAeAcAsAqkqAKEs+lAVAcYiITCZKQSGYISrAtSGGBu5eKsk8wYAIiSE8xInKEaQwziYwAQHw98GMeGGhEgdMQ4yAZ6LsG4W4O4sqmY16OYpQohIKvgvQ50Eiay2CliFOwaOgTQkibw1adIwkQRIRYRYALsvIdAjA0C0yOYmY0ywSEMUMiRxYdwzYWqhgLStYomfoK6tiyRwYbYDukYUBSO0GGawR6AoR4R703Oj2CANg-QLQXonYiSV0+ofo7w9wbYbwzovQ3Qwa4QIxvBaB0+TMn05Al+ae7MyBE+J2sBLBUAZxSWYAL+JeD2zRN4dghg5akonYOSjwnhiAIiOR1KlgHgbYkBkWTOdx-ecBjx705xI+SB4+0JMBsJDxTxX0rxuBG0xw9hy+CANImqyU0wCa2cQJuoGy5BpBVgkwXePBd+RSpxCJzx7BHsnBcOCOt+veTJcJmJLxwhr+cxyRWxqsbYbELwHgouOoORwIpGgYVIpYsumAYREAUxZRMxFRwSNArAcY9AdR1AjAjRcxrRmMjiARb8lafoEpmozKwY7oGcDOUJ0ByOXiKpHu6pLsXuf00CsRuQvI9A0CwpxILe1WZBbEZYn22U7YcSr85pWooIIIhxzpoxfB7pappRLspKfWHxiU6c5g50XwEwLw18sK0Z1058-g34zKYKRRRxjJ-KpAQ4OYYOOhyum424u48R2E6QQScRCRBBxYzYasoIzY-+BxchiAY5ORRg+olgbYMZTp3eKBk+1CTZLZm2bZiIVA7AECbA8RwpZggWHSkiwQ2IVuTKmm107YWgHwzYkm9ZPJ-K0+iJlxo+N+PeqBvJDx5x2JOO+Jn+2SXg-27oSSpW5JhJ7gtioIziZY6cwaZYzBAhiJNm0OHJ3B3JX5z5cJv5gpbxcxzYzi+gwadwWydIj4X2+oPGT4piGcEBsuZ6sAF6EAFM8gqkhA8OOBDMSJ1+NxqJrpOgjFzFrFxA7FnFooDMf5peAFSRnY9wVIWg-4zYTouCcozQwaZgEJpCe6j5WFv8L0qELs25u5-ZJpkZ+Ur8cZdIpZlWWIUoLhoIPcTifcsuBljMMx3pxEoMFERpkMJpzoLolak8wI9ibQVguCj40ogQnwkoRqRC4Gy5txaJXiblWZBacxpy8lIZBxfhrwuCqUKU+GLSIwWg+Sulq5D+DxEsMxb5yJDJT59xAh1VyAUl7xg5nxdIeUuqUKAiMF+V6yvQXSCZclaK5VMJlVTVzsMxqFMOnJKJLpYx0+zVrV-lbw7RzibYJsTQqlki+gu69BlaoG9JmFFVglcAwlc0TUr5iBvF81qZaBQlxALFl1-kuF6eWOOJbVMlLRdwugjwWsPgU8424iFGImVIYWEpmCSFds0CQ4uQSwPF1xd1xx35AhsN8NWAK1uZcMXmcS3oA8ilIefoSSqcFGP4PQgIo1KZKN2FDx6NCNtVt19Vel6JaNcNSwK1eJfuDhU5HYQGdwIIyhTQgJoKZg6sIw5N3SzS0NQs9NWAbJaFXs8OyNDZjVMN7NmNeFn1wZOGvx18mxkwfgd89i50cefgl8+owasuqkCWsIUAcYc4MAOY0UzMjNSNzNp1Nt6AdtDts4TtLtWN7V6qnYLobQTwpauUItKhORvmwQRslaEIY1yVOgXtPtjtYAzt6AzMM16FytHt41Kdttqw9t6dmdLVWt-53NBJxm0oQQ-hwkpidI1pEwtWeRIwdIOohgMtq4nIEgy8tcRhbtY++dyd0+vd-dYAs+gd31N4RB0ongRgOoH4vhuCbQP2fc-GngEi3o3dPk49UAA9KeOdStXJn5p1Y9fdB9k9Qh71OBldicPNCAP4gQ+UwY0KS6Kxtlt4ZW+gtwHKNYoYx1Z9BdUAl9h9bBQ9H5K5IDYD19WBt9IhQdFeEJ-SWgkoMaeo+VVItiYm2x+R8KsuoDE9g9N17tJ1MDxDN9McC+XND9BJjiIQmSndnQoItaVWko0og8W97YbYoGhDsDRhx9XBed5DydRDV9U9Fd0lVdYh4Wgu2IeSG1X9HQxI+g857gNgRyQD0DydIOYOIcZ6X0xAsguKFAzAFAiNw9ojAlejF2wshjF6JjKEZjFA09MjIKpiFIxIIItBlatglBt4nYUiMhVGJiS5I9NjqOoOdjzADjxjhApj5jCts1GFwDujUT+j9jkAjjCTzj5jbjdDYhTwajrwWgHS9iFF4ikiGSla6cS6z4RgyZiV-FYxmaFMcTTjLj8m3yvySm3qdh7jhicl+UZmJN-gHgjejoRCfRCpmslgN8ba1Nqt1CbTBj2T8TiTFj2ZPOM9eZc2ORCaXo9i3Q9iuCVgNi2xuowYpWIQVNzTC1fBqzWTRjnTST9mjmbGLmeWhThBkwCKJgIIoFXoEF1BXgXKowiopOzWSdAl0+FAYABksA6AdU-IqAo4ekeA1ShKsT6zTjljUDSVsLcJ8LiLyLs4qL6LhAmL2LHTuTBTqqj9GM-CNamjpizK+mJ00w584p5Tbojwu9UAJLhASLKLaLGLWLzgOLLzuT+LfFDzJxxLCLwrZLFL4rNLuLdLUjD2tDDLBJHwGoza8o8zHS-QfE7EeoQQjizoHQjiArQrIr5LYrVLErUrOTuKsrKtDVrNds9rKrTr1LkrtLuKK17+uzJ8ZgecCxJgVG7YVuA89wMK4alazKdrSrDrqrzr6r0r7rkDcr91qNPrabfrlLAbrrGzKEK1+BYb9QlY0ora-1S6mxk5JY8oXgyhiMxI15uM9z+btNAhvrorJbLrQbKEyTudp9OjRLDxA7jrQ7WbbrFbWrcxG98lmsEZr8qUji74IY8jGqpVqUIQqbpLg7argbGr7rQjc1ETi1irx7s7p7ZbTjnNSD6mMKAIn4ioJgnVwNVWf+ORrRWCjlHQ2jhLYEZ6d7xSsCsRu82ANAkCcCBQy7zKtdwI18+qV89Yj8eUrQgYtwjbc26hMLYHRbdUxSO5ECW8bq9AFAuQOQHAJEZEFEy74aAIFBDu6cRO9YBOXglukwJgom3Q+64HyrpHNyPifiASfZoSfyuWcxms2DDDfc-1waxIXHYBfRd4RIXorwdz17CQwnDr3iiyDCgZzCR4LcbcnCL7vS3Q+gBIgYoI1Yyj+Z+UZgfgm7Uo78RH+nJH84Yn68-Im8VA28u8+8eEzH34molg2C1l34XHNZ+gEwfc0KAy7oQnvn3iWu2iiycno5tKFu34uxfckzww2otuwaxCqMz26XEHZLCEsA2ASW7rzAFolRMHcH2ACH+QSHbYOR8VHwDD6c8XbE+UbEwyHgZJun1jxHEHTFT1jU-kHrenZ1s3F1vkTU9LfqxYH7pNYVziAt18XHwYFzHKCx34P4IHLTPnq383L1qEY7J9nrqBBnZLGaa3klS72NA2TQTYemdThgZ5XHVG3ggIX6nQDphHSzveL3pHbl2EuKaiOBOEeE3uDHYMcnmlORZgjiHS183oX9NwTWORqsF8rR4aNXIn84cPCPEASP2zcn-EODwQdw-Qv1zbNwb83gAakiEi1WU3aTX8MPVPTU8PektPPWxle5cCA51bK+gQX49plrIVQ32UNw3h5XzYbQIYiF3nK3lP-Bds3FubT3Y0QvBvQsH3CDQpX3iAwkHSajwewknQjiHLqof9GSHDoVzK+GizPbxxZvS1TUD3wjE7oH13+vgf-km3WGiUvQu1r2RO0VALXHczrorQJB1TlgFPhnp6YA0UYA7uXObAqu6uwSlHO8NHdHAzPzLRjbe1f2wkHo-6ww3SWPnw4zxV762fr3uf+fhf3O1hZSOYDcGV9ihyjKPg3QXo7PS6lgi6dI3QZ5hgkPfvd+ZvvfyL-f9PNv8xSZtijTfHT4fgJXavVgti2StYP3Cp3fpHi4CEvUCWq4vrs4SPxvy36-Eg9-tcsgPkz-OB0feOeoECHUrE5robwSeM6C46QtbSLwRrKGAXo395wd-B-j-0FZFsX+PWS9qk0nYzd9eyA7-k-3QH-9Pu1nBAB0irxTBBagiNoFx0IQtBgQ8FUYOc0QE6BUATFWcDi3z5c5qAphWgOYWYCWE4O7cWwsKW0AZJ04BUZImGgCY3BSs4wCfp8HKZWB48uvM3o9WepoDSWGAi4Eb1IZWMBeuAwzuoMIFaCuKG3EgbLy-xtJN0wQSUP4y04n9HgnwQXGYjH7PYLUqgjLuI3AbD43+03cPoZ28FwMSAAA-3F-k14PA92msYkM4hn6NYRmSSDoKeVeDO5PBEHIISQyvxkMDBAQ17hkKoZ3YhSOrLbrPRMzr4Ok0wOwADkcECYG0shTsPaWiosD8hbBLASIxyF69AhAjAoR9Xvq6tP8wIKvCkPd6kJPgtAz8OMDrykULEXYFgbYwphJM-BHQtQRkxib5MLBgzG8GxDpAtBE2clE5FblUDacQegiMpn8ASrv8Mu8wkOEkzaGh8runQ17tcOFjrCre+FHfgEHwRfsiQXEZtAT2yT7RAG7gP5pKBYF3JcUAgigGKk+QKZemNSL1OX13hzF-8dbXoBMB0z2ADUqvG3GCACrKCncFw-wY8NI7giUIkI6EXZj6YfNnMk6b5v0P9R6p5BjwStNGyBD1gkknmfiPBV6AEiwROKMkeYwpHb9SBKIpkeiNZFYjVQpaB4Bvm5GNsdKUPZ7hl1JEuMKRyGOEZ6mIj+lAyyIxkYjHFHJJJRbgKCuPDxE8i8ifI+5KqOJTbNB+6QYfjL02Hqo9RaIlkYaMcEt0Ww18UTPKMJHLDlR-I60eKkpHwjiI1I8dF811GggxRbozESfzXwBBugco3kWkP16hFzgPkX2l0ymQzJn0XqHLjv1Hjlh+gL4IeK2hK4+EwBS6TapPHdAKjV+0PDLnNw0EZs8Aj7GVksJwG5DSOzY1cK2PbHBsNhNfG8OQI943kKMbEZtPWGugCR8i-QTtmQW7aXCbuLY-1gONHZ3CTePMM3r2J8j9iR2oQx+gv1ro9AsO5zE-r9XkFHkOgnYFpHMN87xZEsyWVLNVAuCZYgEMnSJB8KrAWVHgaHZFEkigEjciQDnFsIPEPapijBD49rJ1hfHpZL09AaZLMlDFBcQu4XD4RIMXSt4PAemV3r8FyjeBToyKWwNqBX7Lj9eQvR8R1mfHdY3xwoywTqANj2lNGXoJdKp1V68M98iSMMHql8B+iuxxI+cM8K6adiw+gks6mtmiZP9Xh1Da3qQPsDCY-8GqR8BGGb6qABE3gONH4R57pJ7xkkzJl003HkSoJ+kuxi40PEEkTWeUD+r0G-SdF6wsoQiUmJ9EpjFRpvJsWtwxqOo1xI7JbkSJ3GeSlg+489ouzeHa0d+KnNtsm21R9wtManFpLSjRGdAfGLwX3sZNe67ioAXk4Kdmw3FuwOCj3dKT2MCk5ofJIUiyZ-kin9JyQQtAjO6C47EgPezYSPApK0D1jlucOUBgrnxQc4PcZHEyvuUdHDjEowGdfDeJGqhhNYmHYDg8CETXwX4HQebG5J5idSJA3U55L1IgDeJtyyEiJOAjk7OFn6l8WkNoHYlu8ncBCCYCEEawTd90q09abAE2lvdbuwsVkqJIeH3TC+z0jQW9VknvDSBSQi5qYlBBlgWk7oQ4QSGgoRgl0s5O4HdMdprSvpmUlCvlPZKFSiRn0nqZzm+msUsSQ4+kcWAQo5EGsAQVwgfhFpqhX4KUJws6DGy+EmmHUhGQ9KelNl++kRTsjli-HySX6LDWClPCniHCZCYLHUGFmeBGpwmGMpmUjOQB2N++70+VpjI2nYzYAMsvsVjI9wVSQUbYaMQ3hXSOJ7EaDcYWMH-oN0qwmveGX7URnqytpKs2WdbOD5XtJZls5mcrNVl7jrZmslookkIlnJtQWmV+EDxeD7RTc3Isfi7nUTvjssn48BJAhgRwJF8lg-UIqBjovBP0ltTRhNhwzhZ5eHYAFgzKJHjJWcLsj3LMWKEx8T4eGc6C0miHpJdkViM+CEFHib5fCn4FgZH3u7yz7qAfOEpbz+na0y5gA23uYBdBrtLoRgLzLQM1T6giENgJwo8ETTiRiAzxeABUHqqWCNAQc1oO0GSlT8zEmHYWudAwQ6gQwm7S7ndCSDOR15j4fhJu2bQs9tkmHY-iVkKIOIyCuoS1JYIPlHToh-1M3Jh31rQUKwfcRQWIP3QBwrYNUSweKWaAUYSyg8cENu3dCagpg4Awal6DAWPQIFcERcBAtXBQKLus06eJnB1joxAwhsQqIXCXFEjwFVcNyuhHlz4LHEhC70MQrRgnROUr9ChTdF140KSYQcQ3k1ECitQQoQwYaXDDlBMKkYLC7WGwpzg7CLoBcbhctIth8w+F8EKah9GeKMKMkUiw6FnACbO822RsRRabB4WYKq4L5B2OHGaraLmFeikhSdB8AjzjFV0JRQ2NQK8LrYblKCGJQQiQBbFui1hRBQwR5R84ri0xcoq-ieKpoNyRhdKEUF8c2gzKQ6gZm9llNXCVaaFPnI6GeJLBp0LqjDJXS+YVeesCkJrGHI7IWkdgUxOHNrh5Kisi6bzKuhKW7QtAhsXwN0D8AmZgQtSq1EKgHSEpoRicvJACEnEizEk-Gd8IBgAIAt5OlaFQZErGI2oPkfaXNISjyUZQZRxzSwFdI9C4IYq0FGqcm2BELL3Fp1LFHBlz4Xo8l+IPanKBWKGA12Uyj4AkMmA2BHwdgDwYsr4JYobMNy-BPCkjJBMegItDRuLn1mh4D2zoWXG1ifFdZXx20EoYVg-Cyl4kfCCUs3wkU2JtklrQkGVglk5LTsqw9HOgE-mfBAq7hdOMLjjRfYaUxmYkKciSXtSC5LON3NbM-nFVCypiZ3hG1NYR47gr9Y7n+lw5GABWs+Bid6EORGphICdMEhWOcImABi4hHwDYA0JaEdCzyfQoYSuRQLVCnDKpQflbQByI8a1SRHwm-SJIgg2SgSUUlgATFPS70SwV0HuBmr503oPwCYAmy7UkloMyRIGFeCnLluBbIWPySdUfBdAiKLBO8Gal4SyBHgWUvM1Xx4JrVYkopOmQdXIBLBGUKKqMFCoth6p0Ze3hMEK7TyZCgnXXkUnXKtkwATqsAQ8GUHmBLclqoAnlDjSjxd0bUs+b2zVpCxzilgptNKAu7zSrVsQqxEullK6h5E-4dEQxXOovSfFHFJCBJSaj9rDqImT8KYn47VLVK6cEEvrHIJx1QQrlDRVmuLUjMOihGSvFGSqwYJUV4NEPEc3542q+2AiyOJmqdFwwrV0oOMgPGbD2IOg+VMhYNQHgQFPAcMitUSsykMw+1H6oAUa2IoQEwBfqkWqzzQSlg12cZXTAKzlqYAw1NgPov9kkSBAKhxNBKQsWdDkDUYZEllb-FTrF1fa-tLOonMSTr0JFngILN0B6ILoYq+3PEO8AJXPqe1PdboSvE-lWqNOjEr9ooJK5OVxgoITvPiCub8TU1-KFoSQAYmKUG0RgJdKbm1Qya5Qf1VBL+kYnN5Z1pk9piFJcafzqUImQ6lknJDBB9kRIFoMknBJvx7AXammr-CebrirNsGlfLSFfpfFsQCha9b0hSLRsIwtIW8p5uWYTVC2d7VscOxCmfy2JxMydb4ElBEIDMzm6gtqCtaBFIJZLDZbZ2iFvBIULiH8Jh1DwuEywHwRIa-JYGxL-NT9Sdfl1gqEZCitAshWclnnBpm81G-0bVzqj1dGutPFCGSomGANSqYYWwNNOvgbJEU+qd0GVW+XiSoNK6lrcHiim48eeTKWNRz3vD9bVCalN+CwOp5i8cCDEgFvtBpDB5dMngKAS8tpL9ajy-2ATWJO7lVVNtYi+oD6C2LmZvCHwHxkD3+DZJmpnw3JLFsbEQcN+BfdlS1p1S6AA0VrNZKww9Ejc7y3mOUCoWh1KjYdn-FASYOVbaDEV5cuDaGHP6vBGUYKLQEBLGBY76CTQNQlQqG3682BdUTgciwgBOrPA5YYEH+NULM8oBu1VDokI3pEhEk94zKX-2XX+QGJ888YI02A6U4RgQPZOe2CNTEJ5pgQZoSJvU0tbBIP+PuHYPjRrJ4uXja6Q0M2Srazl24q4cSpuEUBLBDKJsB8FoLuBJVJ-WNILjtL616Q5IS0RCMFEfINlEwsraRXNqEh2ROGXEcmItFFaSRgYkPeKjD1fhDMkeyrSf3BIgkkhlgf1bWNZ0CSze6Y1AVmPMZp7Uir8TPeWPrACrhyduIHQGjSn+SPJL0nKQuyzWPAbEOqMXMFUbnTiaQAIBgi2neDkgelieoSdBLhVwTy8SKuGAymaDNJa8rElFCnzWqpRExGURRh9oeErDzNv-CvS1tHH5QmUVgd0CwvZ78bbEltceJxF12T6cZPkbKWVNylOram6Ww2uyyqFcdggNTceZMFsBmrBtAkxWY9M5xkqbE38kNHsTOnGiNQwVS6L-i4gt6OhYBp6c1t+1y884VIOCiwxrzTSF0W9GsmJnJB46xo6B5WWtxg1YHbwH+ukgnTTiA0KZpJPaqpLpyr5UDoBqWdbIXDPEUsxjKBZWBExqFTEtzIkNnsWlsH5Qu6bSeQZWk8GlZfU1mQjtoO9AfC+xf7vVkc0cTXsAIGCuPoIwwyLZXU6WXbKUM86WthmJff0Hb5L1MEcQ4rL4Cdz9AjDLwEw1bIsPQ5rZ22NIJYdoME48oiSTEdqm71btdDMpZ7M2GWIRgxIEQIAA */
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
                  START_PASSKEY_LOGIN: 'retrievingCredentialRCR',
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
                  BACK: '#authMachine.active.login.loginMethodSelection',
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.login.loginMethodSelection',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
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
                  onDone: [
                    {
                      target: 'registerMethodSelection',
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
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.register.registerMethodSelection',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
                  BACK: {
                    target: '#authMachine.active.register.registerMethodSelection',
                  },
                },
              },

              localRCRSign: {
                on: {
                  FINISH_PASSKEY_AUTH: '#authMachine.active.register.sendingAuthPublicCredential',
                  BACK_TO_IDLE: '#authMachine.active.register.idle',
                  PASSKEY_NOT_SUPPORTED: {
                    target: '#authMachine.active.register.idle',
                    actions: assign({
                      error: (_, event) => event.payload.error,
                    }),
                  },
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
