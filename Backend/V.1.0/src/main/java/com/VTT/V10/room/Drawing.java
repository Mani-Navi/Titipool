package com.VTT.V10.room;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "drawings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "scene")
@EqualsAndHashCode(of = "id")
public class Drawing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "client_drawing_id")
    private String clientDrawingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scene_id", nullable = false)
    private Scene scene;

    private String type;
    private String tool;

    private String stroke;
    private String color;

    @Column(name = "stroke_width")
    private Double strokeWidth;

    @Column(name = "line_width")
    private Double lineWidth;

    private String fill;

    private Double x;
    private Double y;
    private Double width;
    private Double height;
    private Double radius;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "font_family")
    private String fontFamily;

    @Column(name = "font_style")
    private String fontStyle;

    @Column(name = "font_size")
    private Double fontSize;

    @Builder.Default
    @Column(name = "scale_x")
    private Double scaleX = 1.0;

    @Builder.Default
    @Column(name = "scale_y")
    private Double scaleY = 1.0;

    @Builder.Default
    private Double rotation = 0.0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode points;

    @Builder.Default
    @Column(name = "is_gm_layer")
    private Boolean isGMLayer = false;

    @Builder.Default
    @Column(name = "is_visible")
    private Boolean isVisible = true;
}