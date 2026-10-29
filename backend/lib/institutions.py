from typing import Literal

INSTITUTION_SLUGS = (
    "nagybaconi-iskola",
    "ajtai-iskola",
    "kisbaconi-iskola",
    "kisbaconi-ovoda",
    "nagybaconi-ovoda",
    "ajtai-ovoda",
)
DEFAULT_INSTITUTION = "nagybaconi-iskola"

InstitutionSlug = Literal[
    "nagybaconi-iskola",
    "ajtai-iskola",
    "kisbaconi-iskola",
    "kisbaconi-ovoda",
    "nagybaconi-ovoda",
    "ajtai-ovoda",
]
