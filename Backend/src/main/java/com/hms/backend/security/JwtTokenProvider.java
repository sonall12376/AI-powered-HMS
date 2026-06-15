package com.hms.backend.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.jwt.expiration-ms}")
    private long jwtExpirationInMs;

    public String generateToken(String username, String role, String linkedEntityId) {
        try {
            JWSSigner signer = new MACSigner(jwtSecret.getBytes());

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(username)
                    .claim("role", role)
                    .claim("linkedEntityId", linkedEntityId)
                    .issueTime(new Date())
                    .expirationTime(new Date(new Date().getTime() + jwtExpirationInMs))
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Could not generate JWT token", e);
        }
    }

    public boolean validateToken(String authToken) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(authToken);
            JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());
            
            if (!signedJWT.verify(verifier)) {
                return false;
            }

            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            return expirationTime != null && new Date().before(expirationTime);
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    public String getUsernameFromJWT(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            throw new RuntimeException("Could not parse JWT token", e);
        }
    }

    public String getRoleFromJWT(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return (String) signedJWT.getJWTClaimsSet().getClaim("role");
        } catch (ParseException e) {
            throw new RuntimeException("Could not parse JWT token", e);
        }
    }

    public String getLinkedEntityIdFromJWT(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return (String) signedJWT.getJWTClaimsSet().getClaim("linkedEntityId");
        } catch (ParseException e) {
            throw new RuntimeException("Could not parse JWT token", e);
        }
    }
}
