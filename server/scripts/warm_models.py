"""Prefetch embedding + reranker weights at image build time.

Run as a Docker RUN step so the weights are baked into the image layer
instead of downloaded at container startup - the seed script indexes notes
into Chroma on first boot and must not block on a model download then.
"""
from sentence_transformers import SentenceTransformer, CrossEncoder

SentenceTransformer("all-MiniLM-L6-v2")
CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")
